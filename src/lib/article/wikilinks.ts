import type { PluginWithOptions } from "markdown-it";
import type { Renderer } from "markdown-it/index.js";
import type { RuleCore } from "markdown-it/lib/parser_core.mjs";
import type { Link } from "./types";

const SPLIT_PATTERN = /(\[\[[^[\]|]+(?:\|[^[\]]+)?\]\])/g;
const MATCH_PATTERN = /\[\[(?<title>[^[\]|#]+)(?<hash>#[^[\]|]+)?(?:\|(?<label>[^[\]]+))?\]\]/g;

const TOKEN_NAME = "wikilink";
const LINK_CLASS = "wikilink";
const NOT_FOUND_CLASS = "not-found";

export type Options = {
  prefix: string;
  collector: (link: Link) => void;
  contentPromises: Map<string, Promise<string>>;
} & ({ isClient: true; db: undefined } | { isClient: false; db: typeof import("$lib/api/db") });

export const pluginWikilinks: PluginWithOptions<Options> = (mdIt, options) => {
  mdIt.core.ruler.push(TOKEN_NAME, coreRule);
  mdIt.renderer.rules[TOKEN_NAME] = renderer(options!);
};

const coreRule: RuleCore = (state) => {
  for (let i = 0; i < state.tokens.length; i++) {
    if (state.tokens[i].type !== "inline") {
      continue;
    }

    const tokens = state.tokens[i].children;
    if (tokens === null) continue;

    for (let j = tokens.length - 1; j >= 0; j--) {
      const token = tokens[j];
      if (token.type !== "text") continue;
      if (!SPLIT_PATTERN.test(token.content)) continue;
      SPLIT_PATTERN.lastIndex = 0;
      const newTokens = (token.content as string)
        .split(SPLIT_PATTERN)
        .map((content, idx) => {
          MATCH_PATTERN.lastIndex = 0;
          return {
            type: idx % 2 === 0 ? "text" : TOKEN_NAME,
            content,
            attrs: idx % 2 === 0 ? undefined : MATCH_PATTERN.exec(content)?.groups,
          };
        })
        .filter((item) => item.content?.length > 0)
        .map((item) => {
          const newToken = new state.Token(item.type, "", 0);
          newToken.content = item.content;
          if (item.type === TOKEN_NAME) {
            newToken.attrSet("title", item.attrs!.title);
            newToken.attrSet("hash", item.attrs!.hash);
            newToken.attrSet("label", item.attrs!.label);
          }
          return newToken;
        });
      state.tokens[i].children?.splice(j, 1, ...newTokens);
    }
  }
};

const renderer: (opts: Options) => Renderer.RenderRule = (opts) => (tokens, idx) => {
  const title = tokens[idx].attrGet("title")!;
  const hash = tokens[idx].attrGet("hash") ?? null;
  const label = tokens[idx].attrGet("label") ?? title;
  opts.collector({ title, label });
  if (opts.isClient)
    return `<a href="${opts.prefix}${title}${hash ?? ""}" class="${LINK_CLASS}">${label}</a>`;

  let id: string;
  do {
    id = (Math.random() + 1).toString(36).substring(2, 9);
  } while (opts.contentPromises.has(id));

  const linkColor = opts.db
    .getArticle(title)
    .then((res) => res.ok)
    .catch(() => false)
    .then((exists) => (exists ? "" : " " + NOT_FOUND_CLASS));

  opts.contentPromises.set(id, linkColor);

  return `<a href="${opts.prefix}${encodeURIComponent(title)}" class="${LINK_CLASS}{%${id}%}">${label}</a>`;
};
