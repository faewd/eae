<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<main class="flex justify-center pb-12">
  <div class="mt-10 max-w-[75ch] flex-grow">
    {@render children()}
  </div>
</main>
