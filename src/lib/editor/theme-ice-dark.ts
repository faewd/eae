import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";

export default {
  base: "vs-dark",
  inherit: false,
  rules: [
    { token: "delimiter", foreground: "#52525b" },
    { token: "meta.separator", foreground: "#52525b" },
    { token: "keyword", foreground: "#52ccdb", fontStyle: "bold" },
    { token: "comment", foreground: "#1c889e" },
    { token: "string", foreground: "#fef3c7" },
    { token: "strong", foreground: "#e4e4e7", fontStyle: "bold" },
    { token: "emphasis", foreground: "#e4e4e7", fontStyle: "italic" },
    { token: "number", foreground: "#a5b4fc" },
    { token: "operators", foreground: "#52525b" },
    { token: "type", foreground: "#afedf2" },
  ],
  colors: {
    "editor.foreground": "#a1a1aa",
    "editor.background": "#18181b",
    "editorBracketHighlight.foreground1": "#fbcfe8",
    "editorBracketHighlight.foreground2": "#c7d2fe",
    "editorBracketHighlight.foreground3": "#a7f3d0",
    "editorBracketHighlight.foreground4": "#e9d5ff",
    "editorBracketHighlight.foreground5": "#a5f3fc",
    "editorBracketHighlight.foreground6": "#d9f99d",
  },
} satisfies Monaco.editor.IStandaloneThemeData;
