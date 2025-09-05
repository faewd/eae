import type { PluginSimple } from "markdown-it";

export const pluginAnchors: PluginSimple = (mdIt) => {
  mdIt.core.ruler.push("anchor", ({ tokens }) => {
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.type !== "heading_open") continue;
      const slug = tokens[i + 1].children
        ?.filter((t) => t.type === "text" || t.type === "code_inline")
        .map((t) => t.content)
        .join(" ")
        .toLowerCase()
        .replaceAll(/[^a-z0-9\s]+/g, "")
        .replaceAll(/\s+/g, "-");

      if (slug !== undefined) tok.attrSet("id", slug);
    }
  });
};
