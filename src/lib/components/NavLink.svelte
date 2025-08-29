<script lang="ts">
  import cx from "$lib/utils/cx";
  import { ArrowRight } from "@lucide/svelte";
  import type { Snippet } from "svelte";

  interface Props {
    to: string;
    class?: string;
    children: Snippet;
  }

  const { to, children, ...props }: Props = $props();
</script>

<a
  rel="_self"
  href={to}
  class={cx(
    "group flex items-center gap-2 rounded bg-zinc-900 px-4 py-3 font-bold transition-colors hover:bg-zinc-800 hover:text-zinc-100",
    props.class,
  )}
>
  {@render children()}
  <ArrowRight
    class="ml-auto translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-ice-300 group-hover:opacity-100"
  />
</a>
