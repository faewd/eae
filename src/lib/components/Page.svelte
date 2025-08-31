<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<main class="absolute flex min-h-full w-full justify-center pb-12">
  <div class="mt-10 max-w-[75ch] flex-grow">
    {@render children()}
  </div>
</main>
