import { fetchByTag } from "$lib/api/neo4j";
import dedent from "dedent";
import { ArrowRight, Info } from "lucide-static";
import type { PluginWithOptions } from "markdown-it";
import type { Renderer } from "markdown-it/index.js";
// import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import type { RuleCore } from "markdown-it/lib/parser_core.mjs";

const TOKEN_NAME = "embed";

const SPLIT_PATTERN = /(\{%\s*\w+(?:\s+(?:\w+|"[^"]*"))*\s*%\})/;
const ARG_PATTERN = /^(\w+|"(?:\\"|[^"])+")/;

export interface EmbedOptions {
  contentPromises: Map<string, Promise<string>>;
  isClient: boolean;
}

export const pluginEmbed: PluginWithOptions<EmbedOptions> = (mdIt, options) => {
  mdIt.core.ruler.push(TOKEN_NAME, coreRule);
  mdIt.renderer.rules[TOKEN_NAME] = renderer(options!.contentPromises, options!.isClient);
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
          if (idx % 2 === 0) return { type: "text", content };
          let rest = content.substring(2, content.length - 2).trim();
          const parts = [];
          while (rest.length > 0) {
            const part = rest.match(ARG_PATTERN)?.[0];
            if (part === undefined) return { type: "invalid", content };
            parts.push(part);
            rest = rest.substring(part.length).trim();
          }
          const name = parts.shift();
          const args = parts.map((p) => (p.startsWith('"') ? p.substring(1, p.length - 1) : p));
          return {
            type: TOKEN_NAME,
            content,
            attrs: { name, args },
          };
        })
        .filter((item) => item.content?.length > 0)
        .map((item) => {
          const newToken = new state.Token(item.type, "", 0);
          newToken.content = item.content;
          if (item.type === TOKEN_NAME) {
            const writable = newToken as unknown as Record<string, unknown>;
            writable.embedName = item.attrs!.name;
            writable.embedArgs = item.attrs!.args;
          }
          return newToken;
        });
      state.tokens[i].children?.splice(j, 1, ...newTokens);
    }
  }
};

const renderer: (
  promises: Map<string, Promise<string>>,
  isClient: boolean,
) => Renderer.RenderRule = (promises, isClient) => (tokens, idx) => {
  const tok = tokens[idx] as unknown as { embedName: string; embedArgs: string[] };
  const embed = EMBEDS.find((e) => e.name === tok.embedName);
  if (embed === undefined) return `INVALID EMBED ${tok.embedName}`;
  if (isClient)
    return dedent`
      <section class="not-prose bg-ice-300/10 rounded p-4 flex gap-4 items-center text-ice-600 italic">
        ${Info}
        <p>Embeds aren't rendered in previews.</p>
      </section>
    `;
  let id: string;
  do {
    id = (Math.random() + 1).toString(36).substring(2, 9);
  } while (promises.has(id));
  promises.set(id, Promise.resolve(embed.render(tok.embedArgs)));
  return `{%${id}%}`;
};

interface Embed {
  name: string;
  render(args: string[]): string | Promise<string>;
}

const EMBEDS: Embed[] = [
  {
    name: "articles",
    async render(args) {
      const tag = args[0];
      const heading = args[1] ?? `Articles Tagged with: ${tag}`;
      const articles = await fetchByTag(tag);
      const articlesHtml = articles
        .map(
          ({ title }) => dedent`
          <li>
            <a target="_self" href="/wiki/${encodeURIComponent(title)}">
              <article
                class="group flex justify-between rounded bg-zinc-800 p-2 transition-colors hover:bg-zinc-700"
              >
                <h3 class="font-heading font-bold text-ice-200 group-hover:text-ice-100">
                  ${title}
                </h3>
                <span class="translate-x-3 text-ice-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                  ${ArrowRight}
                </span>
              </article>
            </a>
          </li>
        `,
        )
        .join("\n");
      return dedent`
        <section class="not-prose bg-zinc-950 rounded p-4">
          <h1 class="text-2xl font-bold font-heading text-ice-500">${heading}</h1>
          <ul class="flex flex-col items-stretch gap-2 mt-3">
            ${articlesHtml}
          </ul>
        </section>
      `;
    },
  },
];
