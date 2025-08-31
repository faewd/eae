<script lang="ts">
  import type { Article } from "$lib/article/types";
  import cx from "$lib/utils/cx";
  import type { ClassValue } from "clsx";
  import "@mdit/plugin-alert/style";
  import SearchBar from "./SearchBar.svelte";
  import { Braces, Pencil, Tags } from "@lucide/svelte";

  interface Props {
    article: Article;
    searchbar?: boolean;
    editable?: boolean;
    class?: ClassValue;
  }

  let { article, searchbar, editable, ...props }: Props = $props();
</script>

<article
  class={cx(
    "prose flex h-full w-full max-w-full flex-col bg-zinc-900 p-4 prose-zinc prose-invert prose-headings:mr-auto prose-headings:overflow-hidden prose-headings:font-heading prose-headings:text-ice-300 prose-h2:border-b-2 prose-h2:border-b-ice-800",
    props.class,
  )}
>
  <header class="flex items-start justify-between gap-4">
    <h1 class="mb-0">{article.title}</h1>
    {#if searchbar}
      <SearchBar class="max-w-1/2" />
    {/if}
  </header>

  {#if editable}
    <a
      href="/edit/{article.title}"
      class="not-prose absolute top-14 left-2 cursor-pointer rounded bg-amber-950 p-1 text-amber-200 transition-colors hover:bg-amber-900 hover:text-amber-100"
    >
      <Pencil />
    </a>
  {/if}

  <section>
    {#if article.metadata.infobox}
      <aside
        class="not-prose float-right clear-both ml-4 grid w-72 grid-cols-[repeat(2,auto)] gap-2 rounded bg-zinc-950 p-2"
      >
        <h2
          class="col-span-2 rounded bg-zinc-900 px-4 py-1 text-center font-heading text-xl font-bold text-ice-300"
        >
          {article.metadata.infobox.title ?? article.title}
        </h2>
        {#each article.metadata.infobox.items as item, i (i)}
          {#if item.kind === "heading"}
            <h3
              class="col-span-2 rounded bg-zinc-900 px-4 py-0 text-center font-heading font-bold text-ice-300"
            >
              {item.text}
            </h3>
          {:else if item.kind === "fact"}
            <span class="font-bold">{item.label}</span>
            <span>{item.content}</span>
          {:else if item.kind === "list"}
            <span class="font-bold">{item.label}</span>
            {#if item.delimited}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              <span>{@html item.items.join(item.items.some(/[,-]/.test) ? ";" : ":")}</span>
            {:else}
              <ul>
                {#each item.items as listItem, i (i)}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  <li>{@html listItem}</li>
                {/each}
              </ul>
            {/if}
          {:else if item.kind === "image"}
            <img class="col-span-2 w-100 rounded" src={item.src} alt={item.alt} />
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            <p class="col-span-2 text-center text-zinc-500 italic">{@html item.caption}</p>
          {/if}
        {/each}
      </aside>
    {/if}

    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html article.content}
  </section>

  <footer class="mt-auto w-full">
    <section>
      <h2 class="!mb-3 flex items-center gap-2 !border-b-zinc-700 !text-zinc-500">
        <Tags />
        Tags
      </h2>
      {#if article.metadata.tags.length > 0}
        <ul class="not-prose flex gap-2">
          {#each article.metadata.tags.toSorted() as tag, i (i + tag)}
            <li>
              <a
                href="/tag/{tag}"
                class="rounded bg-zinc-800 px-2 py-1 font-bold text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300 hover:underline"
              >
                {tag}
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-zinc-400 italic">This article is untagged.</p>
      {/if}
    </section>
    <section>
      <h2 class="!mb-3 flex items-center gap-2 !border-b-zinc-700 !text-zinc-500">
        <Braces />
        Metadata
      </h2>
      <code><pre class="mt-0 text-zinc-500">{JSON.stringify(article.metadata, null, 2)}</pre></code>
    </section>
  </footer>
</article>

<style lang="postcss">
  @reference "tailwindcss";

  @layer utilities {
    .prose {
      & :where(code):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
        &::before,
        &::after {
          display: none;
          content: "";
        }
      }

      & :global(.markdown-alert),
      & :global(:where(p):not(:where([class~="not-prose"], [class~="not-prose"] *))) {
        margin-top: 1rem;
        margin-bottom: 1rem;
      }

      & :global(.markdown-alert) {
        border-radius: var(--radius-md);
        border: none !important;
        background-color: --alpha(var(--md-alert-bg) / 50%) !important;

        & :global(p.markdown-alert-title) {
          color: var(--md-alert-color) !important;
          align-items: center !important;
          font-weight: 700 !important;
          font-size: larger !important;
          margin-bottom: var(--spacing) !important;

          & ~ :global(p:last-child) {
            margin-top: 0 !important;
          }

          &::before {
            width: 24px !important;
            height: 24px !important;
            margin-top: 1px;
            background-color: var(--md-alert-color);
            mask-image: var(--md-alert-icon) !important;
            mask-size: contain;
            background-image: none !important;
          }
        }

        &.markdown-alert-note {
          --md-alert-color: var(--color-ice-400);
          --md-alert-bg: var(--color-ice-950);
          --md-alert-icon: url("lucide-static/icons/sticky-note.svg");
        }

        &.markdown-alert-tip {
          --md-alert-color: var(--color-emerald-500);
          --md-alert-bg: var(--color-emerald-950);
          --md-alert-icon: url("lucide-static/icons/lightbulb.svg");
        }

        &.markdown-alert-important {
          --md-alert-color: var(--color-pink-400);
          --md-alert-bg: var(--color-pink-950);
          --md-alert-icon: url("lucide-static/icons/bell-ring.svg");
        }

        &.markdown-alert-warning {
          --md-alert-color: var(--color-amber-500);
          --md-alert-bg: var(--color-amber-950);
          --md-alert-icon: url("lucide-static/icons/triangle-alert.svg");
        }

        &.markdown-alert-caution {
          --md-alert-color: var(--color-rose-500);
          --md-alert-bg: var(--color-rose-950);
          --md-alert-icon: url("lucide-static/icons/octagon-x.svg");
        }
      }
    }
  }
</style>
