import dedent from "dedent";
import { ArrowRight, Info } from "lucide-static";
import type { PluginWithOptions } from "markdown-it";
import type { Renderer } from "markdown-it/index.js";
import type { RuleCore } from "markdown-it/lib/parser_core.mjs";

const TOKEN_NAME = "embed";

const SPLIT_PATTERN = /(\{%\s*\w+(?:\s+(?:\w+|"[^"]*"))*\s*%\})/;
const ARG_PATTERN = /^(\w+|"(?:\\"|[^"])+")/;

export type EmbedOptions = {
  contentPromises: Map<string, Promise<string>>;
} & ({ isClient: true; db: undefined } | { isClient: false; db: typeof import("$lib/api/db") });

export const pluginEmbed: PluginWithOptions<EmbedOptions> = (mdIt, options) => {
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

const renderer: (options: EmbedOptions) => Renderer.RenderRule = (opts) => (tokens, idx) => {
  const tok = tokens[idx] as unknown as { embedName: string; embedArgs: string[] };
  const embed = EMBEDS.find((e) => e.name === tok.embedName);
  if (embed === undefined) return `INVALID EMBED ${tok.embedName}`;
  if (embed.isClient) return embed.render(tok.embedArgs);
  if (opts.isClient)
    return dedent`
      <section class="not-prose bg-ice-300/10 rounded p-4 flex gap-4 items-center text-ice-600 italic">
        ${Info}
        <p>Server-side embeds aren't rendered in previews.</p>
      </section>
    `;
  let id: string;
  const embedResult = embed.render(opts.db, tok.embedArgs);
  if (typeof embedResult === "string") return embedResult;
  do {
    id = (Math.random() + 1).toString(36).substring(2, 9);
  } while (opts.contentPromises.has(id));
  opts.contentPromises.set(id, embedResult);
  return `{%${id}%}`;
};

type Embed = ServerEmbed | ClientEmbed;

interface ServerEmbed {
  name: string;
  isClient: false;
  render(db: NonNullable<EmbedOptions["db"]>, args: string[]): string | Promise<string>;
}

interface ClientEmbed {
  name: string;
  isClient: true;
  render(args: string[]): string;
}

const EMBEDS: Embed[] = [
  {
    name: "articles",
    isClient: false,
    async render(db, args) {
      const tag = args[0];
      const heading = args[1] ?? `Articles Tagged with: ${tag}`;
      const articles = await db.fetchByTag(tag);
      const articlesItems = articles
        .map(
          ({ title, summary }) => dedent`
          <li>
            <a
              href="/wiki/${encodeURIComponent(title)}"
              class="group flex items-center gap-2 rounded bg-zinc-900 px-4 py-3 font-bold transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <article>
                <h3 class="font-heading text-lg font-bold text-ice-200 group-hover:text-ice-100">
                  ${title}
                </h3>
                ${summary ? `<p class="font-normal text-zinc-400 italic leading-5">${summary}</p>` : ""}
              </article>
              <span class="translate-x-3 ml-auto text-ice-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                ${ArrowRight}
              </span>
            </a>
          </li>
        `,
        )
        .join("\n");
      const articlesHtml =
        articles.length > 0
          ? dedent`
              <ul class="flex flex-col items-stretch gap-2 mt-3">
                ${articlesItems}
              </ul>
            `
          : `<p class="text-zinc-400 italic">No articles match the criteria.</p>`;
      return dedent`
        <section class="not-prose bg-zinc-950 rounded p-4">
          <h1 class="text-2xl font-bold font-heading text-ice-500">${heading}</h1>
          ${articlesHtml}
        </section>
      `;
    },
  },
  {
    name: "clear",
    isClient: true,
    render() {
      return `<p style="clear: both;"></p>`;
    },
  },
];
