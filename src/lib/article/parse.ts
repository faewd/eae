import MarkdownIt from "markdown-it";
import pluginFrontMatter from "markdown-it-front-matter";
import { alert as pluginAlert } from "@mdit/plugin-alert";
import * as yaml from "yaml";
import type { Article, ArticleMetadata, Link } from "./types";
import { pluginWikilinks, type Options as WikilinkOptions } from "./wikilinks";

export type Span = { offset: number; length: number };

export class ParserError extends Error {
  constructor(
    public readonly span: Span,
    message: string,
  ) {
    super(message);
  }
}

function createMarkdownParser(linkCollector: () => void, wikilinkPrefix = "/article/") {
  return MarkdownIt()
    .use(pluginFrontMatter, () => {})
    .use(pluginAlert)
    .use(pluginWikilinks, {
      collector: linkCollector,
      prefix: wikilinkPrefix,
    } satisfies WikilinkOptions);
}

export function parse(source: string, wikilinkPrefix = "/article/"): Article {
  const links: Link[] = [];

  const md = createMarkdownParser(links.push, wikilinkPrefix);

  const tokens = md.parse(source, {});
  const frontmatter = tokens.find((token) => token.type === "front_matter" && token.meta);
  const metadataRaw = parseFrontmatter(frontmatter?.meta);
  const metadata = renderMetadata(metadataRaw, md);

  const content = md.render(source).replace(/<h1>[^<]+<\/h1>/g, "");
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

const FM_DEFAULTS = {};

function parseFrontmatter(source: string | undefined): ArticleMetadata {
  const properties = source !== undefined ? yaml.parse(source) : {};

  return Object.assign({}, FM_DEFAULTS, properties);
}

function renderMetadata(meta: ArticleMetadata, md: MarkdownIt): ArticleMetadata {
  const rendered = structuredClone(meta);
  if (meta.infobox) {
    for (let i = 0; i < meta.infobox.items.length; i++) {
      const item = meta.infobox.items[i];
      switch (item.kind) {
        case "fact":
          // eslint-disable-next-line no-case-declarations
          const fact = rendered.infobox!.items[i] as typeof item;
          fact.content = md.renderInline(item.content);
          break;
        case "list":
          // eslint-disable-next-line no-case-declarations
          const list = rendered.infobox!.items[i] as typeof item;
          list.items = item.items.map((li) => md.renderInline(li));
          break;
        case "image":
          // eslint-disable-next-line no-case-declarations
          const image = rendered.infobox!.items[i] as typeof item;
          image.caption = md.renderInline(item.caption);
          break;
      }
    }
  }

  return rendered;
}
