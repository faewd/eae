<script lang="ts">
  import ArticleView from "$lib/components/ArticleView.svelte";
  import MonacoEditor from "$lib/components/MonacoEditor.svelte";
  import {
    CloudAlert,
    Eye,
    EyeClosed,
    History,
    Info,
    OctagonAlert,
    Save,
    Shell,
    SquareArrowOutUpRight,
    Trash,
  } from "@lucide/svelte";
  import { diff, isEmpty } from "$lib/article/diff";
  import { parse, ParserError } from "$lib/article/parse";
  import cx from "$lib/utils/cx";
  import type { PageProps } from "./$types";
  import RenameModal from "./RenameModal.svelte";
  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import type { Article } from "$lib/article/types";
  import type { NavigationTarget } from "@sveltejs/kit";
  import ChangesModal from "./ChangesModal.svelte";

  let { data: article }: PageProps = $props();

  let editor: MonacoEditor | null = $state(null);

  let base = $state(article);
  let value = $state(article.source);

  afterNavigate(() => {
    base = article;
    value = article.source;
  });

  let preview: Article | null = $state(null);
  let parsingErrors: ParserError[] = $state([]);

  $effect(() => {
    parse(value, undefined, "/edit/")
      .then((article) => {
        preview = article;
        parsingErrors = [];
      })
      .catch((err) => {
        console.error(err);
        preview = null;
        parsingErrors =
          err instanceof ParserError
            ? [err]
            : [new ParserError({ offset: 1, length: 1 }, "Failed to parse article")];
      });
  });

  let changes: string = $derived.by(() => {
    const title = preview?.title ?? base.title;
    return diff(title, value, base.title, base.source);
  });
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
  let showChangesModal = $state(false);
  let navigationTarget: NavigationTarget | null = $state(null);
  let forceNavigate = $state(false);

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
        const newArticle = await parse(value, undefined);
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

  let deleting = $state(false);

  async function deleteArticle() {
    const msg = `Are you sure you want to delete the article "${base.title}"? This action is irreversible.`;
    if (!confirm(msg)) return;

    const title = encodeURIComponent(base.title);

    try {
      deleting = true;
      const res = await fetch(`/api/articles/${title}`, { method: "DELETE" });
      console.log(await res.json());
      if (res.ok) return goto("/");
      console.error(res.status, res.statusText, await res.text());
      error = "Failed to delete the article.";
    } catch (err) {
      console.error(err);
      error = "Failed to delete the article.";
    } finally {
      deleting = false;
    }
  }

  beforeNavigate((event) => {
    if (forceNavigate || !hasChanged) return;
    event.cancel();
    showChangesModal = true;
    navigationTarget = event.to;
  });
</script>

<svelte:head>
  <title>Edit Article | {article.title}</title>
</svelte:head>

<main class="flex h-screen max-h-full flex-col">
  <div class="flex h-12 flex-none items-center gap-2 bg-zinc-800 px-4">
    <h1 class="ml-12 text-2xl font-bold text-ice-200">Æ</h1>
    <a
      class="ml-2 cursor-pointer rounded-sm bg-zinc-900 p-1 transition-colors hover:bg-ice-950 hover:text-ice-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
      href={"/wiki/" + encodeURIComponent(article.title)}
      target="_blank"
    >
      <SquareArrowOutUpRight />
    </a>
    <button
      class="cursor-pointer rounded-sm bg-zinc-900 p-1 transition-colors hover:bg-ice-950 hover:text-ice-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
      disabled={!hasChanged}
      onclick={() => saveArticle()}
    >
      {#if saving}
        <Shell size={24} class="animate-spin" />
      {:else}
        <Save size={24} />
      {/if}
    </button>
    <div class="mr-4 text-sm leading-[1.2] text-zinc-500 italic">
      {#if hasChanged}
        <div class="mt-px whitespace-nowrap text-rose-300/70">
          <CloudAlert class="-mt-1 inline" size="16" />
          Unsaved Changes
        </div>
      {/if}
      {#if status !== null}
        <div>
          <Info class="-mt-1 inline" size="16" />
          {status}
        </div>
      {:else}
        <div>
          <History class="inline" size="16" />
          Last saved: {lastSync.toLocaleTimeString()}
        </div>
      {/if}
    </div>
    {#if error !== null}
      <div class="whitespace-nowrap text-rose-400">
        <OctagonAlert class="inline" />
        {error}
      </div>
    {/if}
    <button
      class="ml-auto cursor-pointer rounded-sm bg-rose-400/30 p-1 text-rose-300 transition-colors hover:bg-rose-400/50 hover:text-rose-200"
      onclick={() => deleteArticle()}
    >
      {#if deleting}
        <Shell size={24} class="animate-spin" />
      {:else}
        <Trash size={24} />
      {/if}
    </button>
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

  <ChangesModal
    bind:show={showChangesModal}
    title={base.title}
    onsave={() => {
      saveArticle(true);
      forceNavigate = true;
      goto(navigationTarget!.url);
    }}
    ondiscard={() => {
      forceNavigate = true;
      goto(navigationTarget!.url);
    }}
  />
</main>
