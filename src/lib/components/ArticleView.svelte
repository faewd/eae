<script lang="ts">
  import type { Article } from "$lib/article/types";
  import cx from "$lib/utils/cx";
  import type { ClassValue } from "clsx";
  import "@mdit/plugin-alert/style";
  import SearchBar from "./SearchBar.svelte";
  import {
    Braces,
    Building2,
    Castle,
    Eye,
    House,
    Landmark,
    MapPin,
    Pencil,
    Tag,
    Tags,
  } from "@lucide/svelte";
  import { Document, stringify, type YAMLMap, type YAMLSeq } from "yaml";
  import loader from "@monaco-editor/loader";
  import themeIceDark from "$lib/editor/theme-ice-dark";

  interface Props {
    article: Article;
    searchbar?: boolean;
    editable?: boolean;
    class?: ClassValue;
  }

  let { article, searchbar, editable, ...props }: Props = $props();
  let mdPreview: HTMLPreElement;
  let metaYaml = $derived.by(() => {
    const md = new Document(article.metadata);
    const tags = md.get("tags") as YAMLSeq;
    if (tags) tags.flow = true;
    const pins = md.get("pins") as YAMLSeq;
    pins?.items.forEach((item) => (((item as YAMLMap).get("coords") as YAMLSeq).flow = true));
    return md;
  });

  $effect(() => {
    if (metaYaml) {
      import("monaco-editor").then(async (monacoEditor) => {
        loader.config({ monaco: monacoEditor.default });
        const monaco = await loader.init();
        monaco.editor.defineTheme("ice-dark", themeIceDark);
        monaco.editor.colorizeElement(mdPreview, { theme: "ice-dark" });
      });
    }
  });
</script>

<article
  class={cx(
    "prose flex h-full w-full max-w-full flex-col bg-zinc-900 p-2 prose-zinc prose-invert lg:p-4 prose-headings:mr-auto prose-headings:overflow-hidden prose-headings:font-heading prose-headings:text-ice-300 prose-h2:mt-8 prose-h2:border-b-2 prose-h2:border-b-ice-800",
    props.class,
  )}
>
  <header
    class="flex w-full flex-col-reverse justify-between gap-12 lg:flex-row lg:items-start lg:gap-4"
  >
    <h1 class="!m-0 inline-block">{article.title}</h1>
    <div class="ml-auto flex w-full justify-end gap-2 lg:w-auto lg:max-w-1/2 lg:flex-grow">
      {#if editable}
        <a
          href="/edit/{article.title}"
          class="flex size-10 cursor-pointer items-center justify-center rounded bg-amber-950 text-amber-200 transition-colors hover:bg-amber-900 hover:text-amber-100 lg:fixed lg:top-14 lg:left-2 lg:size-8"
        >
          <Pencil />
        </a>
      {/if}
      {#if searchbar}
        <SearchBar />
      {/if}
    </div>
  </header>

  <section class="article-content">
    {#if article.metadata.infobox}
      <aside
        class="not-prose clear-both mt-4 mb-4 grid grid-cols-[repeat(2,auto)] gap-2 rounded bg-zinc-950 p-2 lg:float-right lg:ml-4 lg:max-w-1/2"
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
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            <span>{@html item.content}</span>
          {:else if item.kind === "list"}
            <span class="font-bold">{item.label}</span>
            {#if item.delimited}
              <span>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html item.items.join(item.items.some((s) => /[,-]/.test(s)) ? "; " : ", ")}
              </span>
            {:else}
              <ul>
                {#each item.items as listItem, i (i)}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  <li>{@html listItem}</li>
                {/each}
              </ul>
            {/if}
          {:else if item.kind === "image"}
            <div class="col-span-2 flex flex-col items-center">
              <img class="w-100 rounded" src={item.src} alt={item.alt} />
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              <p class="text-center text-zinc-500 italic">{@html item.caption}</p>
            </div>
          {/if}
        {/each}
      </aside>
    {/if}

    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html article.content}
  </section>

  <footer class="mt-auto w-full">
    <section>
      <h2 class="!mb-3 flex items-center gap-2 !border-b-zinc-600 !text-zinc-400">
        <Tags />
        Tags
      </h2>
      {#if article.metadata.tags.length > 0}
        <ul class="not-prose flex flex-wrap gap-2">
          {#each article.metadata.tags.toSorted() as tag, i (i + tag)}
            <li>
              <a
                href="/tag/{tag}"
                class="rounded bg-zinc-950 px-2 py-1 font-bold whitespace-nowrap text-ice-200 transition-colors hover:bg-ice-900 hover:text-ice-100 hover:underline"
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
    {#if article.metadata.pins.length > 0}
      <section>
        <h2 class="!mb-3 flex items-center gap-2 !border-b-zinc-600 !text-zinc-400">
          <MapPin />
          Map Pins
        </h2>
        <ul class="not-prose flex gap-2">
          {#each article.metadata.pins as pin, i (i)}
            <li class="rounded bg-zinc-950 px-2 py-1 font-bold text-ice-200">
              <div class="flex items-center gap-2">
                {#if ["region", "domain", "zone"].includes(pin.type)}
                  <Tag />
                {:else if pin.type === "capital"}
                  <Castle />
                {:else if pin.type === "city"}
                  <Building2 />
                {:else if pin.type === "town"}
                  <House />
                {:else if pin.type === "poi"}
                  <Eye />
                {:else if pin.type === "ruin"}
                  <Landmark />
                {/if}
                <h3>{pin.label ?? article.title}</h3>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    <section>
      <h2 class="!mb-3 flex w-full items-center gap-2 !border-b-zinc-600 !text-zinc-400">
        <Braces />
        Metadata
      </h2>
      <details>
        <summary
          class="mb-2 cursor-pointer text-zinc-400 italic transition-colors hover:text-zinc-300"
        >
          Reveal metadata
        </summary>
        <code>
          <pre
            bind:this={mdPreview}
            class="mt-0 max-w-[calc(100vw-12*var(--spacing))] text-base text-zinc-500"
            data-lang="yaml">{stringify(metaYaml, {
              flowCollectionPadding: false,
            })}</pre>
        </code>
      </details>
    </section>
  </footer>
</article>

<style lang="postcss">
  @reference "tailwindcss";

  .article-content > :global(*:not(p)) {
    margin-right: auto;
    overflow-x: hidden;
  }

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
