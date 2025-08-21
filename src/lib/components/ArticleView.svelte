<script lang="ts">
  import type { Article } from "$lib/article/types";
  import cx from "$lib/utils/cx";
  import type { ClassValue } from "clsx";
  import "@mdit/plugin-alert/style";

  interface Props {
    article: Article;
    class?: ClassValue;
  }

  let { article, ...props }: Props = $props();
</script>

<article
  class={cx(
    "prose w-full max-w-full bg-zinc-900 p-4 prose-zinc prose-invert prose-headings:font-heading prose-headings:text-ice-300 prose-h2:border-b-2 prose-h2:border-b-ice-900",
    props.class,
  )}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html article.content}
  <hr />
  <h2>Metadata</h2>
  <code><pre>{JSON.stringify(article.metadata, null, 2)}</pre></code>
</article>

<style>
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
