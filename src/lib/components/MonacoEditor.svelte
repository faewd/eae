<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import loader from "@monaco-editor/loader";
  import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";
  import type { ClassValue } from "clsx";
  import tokensProvider from "$lib/editor/tokens-provider";
  import themeIceDark from "$lib/editor/theme-ice-dark";
  import type { Span } from "$lib/article/parse";
  import { debounce } from "$lib/utils/debounce";
  import cx from "$lib/utils/cx";

  let editor: Monaco.editor.IStandaloneCodeEditor;
  let monaco: typeof Monaco;
  let editorContainer: HTMLElement;

  let saveAction: Monaco.IDisposable | null = $state(null);

  interface Props {
    value: string;
    class?: ClassValue;
    errors: { span: Span; message: string }[];
    onsave: () => void;
  }

  let { value = $bindable(), errors, onsave, ...props }: Props = $props();

  onMount(async () => {
    const monacoEditor = await import("monaco-editor");
    loader.config({ monaco: monacoEditor.default });

    monaco = await loader.init();

    monaco.languages.register({ id: "md-with-frontmatter" });
    monaco.languages.setMonarchTokensProvider("md-with-frontmatter", tokensProvider);

    monaco.editor.defineTheme("ice-dark", themeIceDark);

    editor = monaco.editor.create(editorContainer, {
      value,
      language: "md-with-frontmatter",
      theme: "ice-dark",
      tabCompletion: "off",
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      fontFamily: "var(--font-mono)",
      fontSize: 18,
      fontWeight: "500",
      // @ts-expect-error: TS types say this should be an object with nested property; Monaco disagrees.
      "bracketPairColorization.enabled": true,
      padding: {
        top: 16,
      },
    });

    saveAction = editor.addAction({
      id: "ctrl-s-save",
      label: "Save Article",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      precondition: undefined,
      keybindingContext: undefined,
      contextMenuGroupId: "file",
      contextMenuOrder: 1.5,
      run: () => onsave(),
    });

    editor.onDidChangeModelContent((e) => {
      if (!e.isFlush) {
        value = editor?.getValue() ?? "";
      }
    });
  });

  onMount(() => {
    const resizeListener = debounce(layout, 300);
    window.addEventListener("resize", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
    };
  });

  $effect(() => {
    if (value && editor) {
      if (!editor.hasWidgetFocus() && (editor.getValue() ?? "" !== value)) {
        editor.setValue(value);
      }
    }
  });

  $effect(() => {
    if (errors && editor) {
      const model = editor.getModel();
      if (!model) return;
      const markers = errors.map(({ span, message }) => {
        const start = model.getPositionAt(span.offset);
        const end = model.getPositionAt(span.offset + span.length);
        return {
          message,
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: end.lineNumber,
          endColumn: end.column,
        };
      });

      monaco.editor.setModelMarkers(model, "errors", markers);
    }
  });

  export function layout() {
    requestAnimationFrame(() => {
      editor?.layout();
    });
  }

  onDestroy(() => {
    saveAction?.dispose();
    monaco?.editor.getModels().forEach((model) => model.dispose());
    editor?.dispose();
  });
</script>

<div class={cx("h-full w-full", props.class)} bind:this={editorContainer}></div>

<style>
  :global(.decoration-added) {
    margin-left: 3px;
    width: 4px !important;
    background-color: var(--color-emerald-400);
    opacity: 0.3;
  }
  :global(.decoration-changed) {
    margin-left: 3px;
    width: 4px !important;
    background-color: var(--color-indigo-400);
    opacity: 0.3;
  }

  :global(.decoration-removed) {
    margin-left: 7px;
    height: 0px !important;
    width: 0px !important;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid var(--color-rose-400);
    position: relative;
    bottom: -6px;
    opacity: 0.3;
  }
</style>
