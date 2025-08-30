import MarkdownIt from "markdown-it";
import pluginFrontMatter from "markdown-it-front-matter";
import { alert as pluginAlert } from "@mdit/plugin-alert";
import type { Article, Link } from "./types";
import { pluginWikilinks } from "./wikilinks";
import { pluginEmbed } from "./embeds";
import { parseMetadata, type ArticleMetadata } from "./metadata";

export type Span = { offset: number; length: number };

export class ParserError extends Error {
  constructor(
    public readonly span: Span,
    message: string,
  ) {
    super(message);
  }
}

function createMarkdownParser(
  linkCollector: (link: Link) => void,
  contentPromises: Map<string, Promise<string>>,
  db: typeof import("$lib/api/db") | undefined,
  wikilinkPrefix: string,
) {
  return MarkdownIt()
    .use(pluginFrontMatter, () => {})
    .use(pluginAlert)
    .use(pluginEmbed, {
      contentPromises,
      isClient: db === undefined,
      db,
    })
    .use(pluginWikilinks, {
      collector: linkCollector,
      prefix: wikilinkPrefix,
      contentPromises,
      isClient: db === undefined,
      db,
    });
}

export async function parse(
  source: string,
  db: typeof import("$lib/api/db") | undefined = undefined,
  wikilinkPrefix = "/wiki/",
): Promise<Article> {
  const links: Link[] = [];
  const contentPromises = new Map<string, Promise<string>>();

  const md = createMarkdownParser((link) => links.push(link), contentPromises, db, wikilinkPrefix);

  const tokens = md.parse(source, {});
  const frontmatter = tokens.find((token) => token.type === "front_matter" && token.meta);
  const metadataRaw = parseMetadata(frontmatter?.meta);
  const metadata = await renderMetadata(metadataRaw, md, contentPromises);
  const content = await fulfilContentPromises(
    md.render(source).replace(/<h1>[^<]+<\/h1>/g, ""),
    contentPromises,
  );

  const title = extractTitle(source);
  return { title, metadata, links, content, source };
}

function extractTitle(source: string): string {
  const matches = [...source.matchAll(/^#[^#].+$/gm)];
  if (matches.length === 0) {
    const offset = Math.max(0, source.indexOf("---", 3)) + 4;
    throw new ParserError({ offset, length: 1 }, "Articles must have a title (# ...).");
  }
  if (matches.length !== 1)
    throw new ParserError(
      { offset: matches[1].index, length: matches[1][0].length },
      "Articles may not have more than one title.",
    );
  return matches[0][0].substring(1).trim();
}

async function fulfilContentPromises(
  content: string,
  contentPromises: Map<string, Promise<string>>,
): Promise<string> {
  for (const [contentId, promise] of contentPromises) {
    const placeholder = `{%${contentId}%}`;
    if (content.includes(placeholder)) {
      const value = await promise;
      content = content.replace(placeholder, value);
    }
  }
  return content;
}

async function renderMetadata(
  meta: ArticleMetadata,
  md: MarkdownIt,
  contentPromises: Map<string, Promise<string>>,
): Promise<ArticleMetadata> {
  function renderInline(content: string): Promise<string> {
    return fulfilContentPromises(md.renderInline(content), contentPromises);
  }

  const rendered = structuredClone(meta);
  if (meta.infobox) {
    for (let i = 0; i < meta.infobox.items.length; i++) {
      const item = meta.infobox.items[i];
      switch (item.kind) {
        case "fact":
          // eslint-disable-next-line no-case-declarations
          const fact = rendered.infobox!.items[i] as typeof item;
          fact.content = await renderInline(item.content);
          break;
        case "list":
          // eslint-disable-next-line no-case-declarations
          const list = rendered.infobox!.items[i] as typeof item;
          list.items = await Promise.all(item.items.map((li) => renderInline(li)));
          break;
        case "image":
          // eslint-disable-next-line no-case-declarations
          const image = rendered.infobox!.items[i] as typeof item;
          image.caption = await renderInline(item.caption);
          break;
      }
    }
  }

  return rendered;
}
