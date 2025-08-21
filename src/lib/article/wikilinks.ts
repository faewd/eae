import type { PluginWithOptions } from "markdown-it";
import type { Renderer } from "markdown-it/index.js";
import type { RuleCore } from "markdown-it/lib/parser_core.mjs";
import type { Link } from "./types";

const SPLIT_PATTERN = /(\[\[[^[\]|]+(?:\|[^[\]]+)?\]\])/g;
const MATCH_PATTERN = /\[\[(?<title>[^[\]|]+)(?:\|(?<label>[^[\]]+))?\]\]/g;

const TOKEN_NAME = "wikilink";
const LINK_CLASS = "text-ice-300 no-underline hover:underline hover:text-ice-200";

interface Options {
  tokenName?: string;
  linkClass?: string;
  wikilinkCollector?: (link: Link) => void;
}

type ResolvedOptions = Pick<Options, "wikilinkCollector"> &
  Required<Omit<Options, "wikilinkCollector">>;

export const pluginWikilinks: PluginWithOptions<Options> = (mdIt, options) => {
  const opts = Object.assign(
    {
      tokenName: TOKEN_NAME,
      linkClass: LINK_CLASS,
    },
    options ?? {},
  );
  mdIt.core.ruler.push(opts.tokenName, coreRule(opts));
  mdIt.renderer.rules[opts.tokenName] = renderer(opts);
};

const coreRule: (opts: ResolvedOptions) => RuleCore = (opts) => (state) => {
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
            type: idx % 2 === 0 ? "text" : opts.tokenName,
            content,
            attrs: idx % 2 === 0 ? undefined : MATCH_PATTERN.exec(content)?.groups,
          };
        })
        .filter((item) => item.content?.length > 0)
        .map((item) => {
          const newToken = new state.Token(item.type, "", 0);
          newToken.content = item.content;
          if (item.type === opts.tokenName) {
            newToken.attrSet("title", item.attrs!.title);
            newToken.attrSet("label", item.attrs!.label);
          }
          return newToken;
        });
      state.tokens[i].children?.splice(j, 1, ...newTokens);
      console.log(state.tokens[i].children?.map((t) => t.content));
    }
  }
};

const renderer: (opts: ResolvedOptions) => Renderer.RenderRule = (opts) => (tokens, idx) => {
  const title = tokens[idx].attrGet("title")!;
  const label = tokens[idx].attrGet("label") ?? title;
  opts.wikilinkCollector?.({ title, label });
  return `<a href="/article/${title}" class="${opts.linkClass}">${label}</a>`;
};
