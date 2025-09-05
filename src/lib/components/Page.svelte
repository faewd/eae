<script lang="ts">
  import cx from "$lib/utils/cx";
  import type { ClassValue } from "clsx";
  import type { Snippet } from "svelte";

  interface Props {
    class?: ClassValue;
    children: Snippet;
  }

  let { children, class: className }: Props = $props();
</script>

<main class={cx("absolute flex h-dvh w-full justify-center overflow-y-auto pb-12", className)}>
  <div class="max-w-[75ch] flex-grow p-4 md:p-0 lg:mt-10">
    {@render children()}
  </div>
</main>
