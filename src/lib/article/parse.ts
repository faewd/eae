import markdownIt from "markdown-it";
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

export function parse(source: string, wikilinkPrefix = "/article/"): Article {
  const links: Link[] = [];

  const md = markdownIt()
    .use(pluginFrontMatter, () => {})
    .use(pluginAlert)
    .use(pluginWikilinks, {
      collector: (link) => links.push(link),
      prefix: wikilinkPrefix,
    } satisfies WikilinkOptions);

  const tokens = md.parse(source, {});
  const frontmatter = tokens.find((token) => token.type === "front_matter" && token.meta);
  const metadata = parseFrontmatter(frontmatter?.meta);
  const content = md.render(source);
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

const FM_DEFAULTS = {
  aliases: [],
  pins: [],
};

function parseFrontmatter(source: string | undefined): ArticleMetadata {
  const properties = source !== undefined ? yaml.parse(source) : {};

  return Object.assign({}, FM_DEFAULTS, properties);
}
