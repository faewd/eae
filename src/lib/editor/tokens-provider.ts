import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";

const tokensProvier: Monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [[/^---+$/, { token: "delimiter", next: "@frontmatter", nextEmbedded: "yaml" }]],
    frontmatter: [[/^---+$/, { token: "@rematch", next: "@md", nextEmbedded: "@pop" }]],
    md: [[/^---+$/, { token: "delimiter", nextEmbedded: "markdown", next: "@content" }]],
    content: [[/\w\b\w/, { token: "meta.content", nextEmbedded: "@pop", next: "@pop" }]],
  },
};

export default tokensProvier;
