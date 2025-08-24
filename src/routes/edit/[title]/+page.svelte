<script lang="ts">
  import ArticleView from "$lib/components/ArticleView.svelte";
  import MonacoEditor from "$lib/components/MonacoEditor.svelte";
  import { CloudAlert, Eye, EyeClosed, OctagonAlert, Save, Shell } from "@lucide/svelte";
  import { diff, isEmpty } from "$lib/article/diff";
  import { parse, ParserError } from "$lib/article/parse";
  import cx from "$lib/utils/cx";
  import type { PageProps } from "./$types";
  import RenameModal from "./RenameModal.svelte";
  import { afterNavigate } from "$app/navigation";

  let { data: article }: PageProps = $props();

  let editor: MonacoEditor | null = $state(null);

  let base = $state(article);
  let value = $state(article.source);

  afterNavigate(() => {
    base = article
    value = article.source
  })

  let { article: preview, errors: parsingErrors } = $derived.by(() => {
    try {
      const article = parse(value, "/edit/");
      return { article, errors: [] as ParserError[] };
    } catch (err) {
      return {
        article: null,
        errors:
          err instanceof ParserError
            ? [err]
            : [new ParserError({ offset: 1, length: 1 }, "Failed to parse article.")],
      };
    }
  });

  let changes: string = $derived(
    diff(preview?.title ?? base.title, value, base.title, base.source),
  );
  let hasChanged: boolean = $derived(!isEmpty(changes));

  let showPreview = $state(true);
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    showPreview;
    editor?.layout();
  });

  let saving = $state(false);
  let error: string | null = $state(null);
  let status: string | null = $state(null);
  let lastSync: Date = $state(new Date());
  let showRenameModal = $state(false);

  async function saveArticle(force = false) {
    if (preview === null) {
      alert("You must fix all errors in the article before saving.");
      return;
    }

    if (preview.title !== base.title && !force) {
      showRenameModal = true;
      return;
    }

    saving = true;
    error = null;
    status = "Saving...";

    const title = encodeURIComponent(base.title);

    try {
      const res = await fetch(`/api/articles/${title}`, {
        method: "PATCH",
        body: changes,
        headers: {
          "Content-Type": "text/markdown",
        },
      });
      const body = await res.json();
      if (!res.ok) {
        console.error(body);
        error = body.error ?? "Unexpected error while saving.";
      } else {
        value = body.content;
        const newArticle = parse(value);
        if (newArticle.title !== base.title) {
          window.location.href = `/editor/${newArticle.title}`;
        }
        base = newArticle;
        lastSync = new Date();
      }
    } catch (err) {
      console.error(err);
      error = "An unexpected error occurred.";
    } finally {
      saving = false;
      status = null;
    }
  }
</script>

<svelte:head>
  <title>Edit Article | {article.title}</title>
</svelte:head>

<main class="flex h-screen max-h-full flex-col">
  <div class="flex h-12 flex-none items-center gap-4 bg-zinc-800 px-4">
    <h1 class="text-2xl font-bold text-ice-200">Æ</h1>
    <button
      class="hover:bg-ice-950 cursor-pointer rounded-sm bg-zinc-900 p-1 transition-colors hover:text-ice-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
      disabled={!hasChanged}
      onclick={() => saveArticle()}
    >
      {#if saving}
        <Shell size={24} class="animate-spin" />
      {:else}
        <Save size={24} />
      {/if}
    </button>
    <div class="mr-4 text-sm text-zinc-500 italic">
      {#if status !== null}
        {status}
      {:else}
        Last saved: {lastSync.toLocaleTimeString()}
      {/if}
    </div>
    {#if error !== null}
      <div class="ml-auto whitespace-nowrap text-rose-400">
        <OctagonAlert class="inline" />
        {error}
      </div>
    {:else if hasChanged}
      <div class="ml-auto whitespace-nowrap text-rose-300/70">
        <CloudAlert class="inline" />
        Unsaved Changes
      </div>
    {/if}
  </div>
  <div class="relative flex h-[calc(100%-12*var(--spacing))]">
    <MonacoEditor
      bind:this={editor}
      bind:value
      errors={parsingErrors}
      class={showPreview && "w-1/2"}
      onsave={saveArticle}
    ></MonacoEditor>
    <div class={cx("w-1/2 overflow-y-scroll", { hidden: !showPreview })}>
      {#if preview !== null}
        <ArticleView article={preview} />
      {:else}
        <div class="p-12">
          <div class="text-center text-rose-400">
            Failed to render a preview. Make sure there aren't any errors in the article.
          </div>
          {#if parsingErrors.length > 0}
            <h2 class="mt-8 mb-2 text-2xl font-bold">Errors</h2>
            <ul class="list-disc pl-6">
              {#each parsingErrors as error, i (i)}
                <li>{error.message}</li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
    </div>
    <div class="absolute right-4 bottom-4">
      <button
        onclick={() => (showPreview = !showPreview)}
        class="relative z-100 cursor-pointer rounded-sm bg-ice-900 p-1 text-ice-300 transition-colors hover:bg-ice-800"
      >
        {#if showPreview}
          <EyeClosed />
        {:else}
          <Eye />
        {/if}
      </button>
    </div>
  </div>

  <RenameModal
    bind:show={showRenameModal}
    new={preview?.title ?? "Invalid"}
    old={base.title}
    onconfirm={() => saveArticle(true)}
  />
</main>
