<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<main class="absolute flex h-dvh w-full justify-center overflow-y-auto pb-12">
  <div class="max-w-[75ch] flex-grow p-4 md:p-0 lg:mt-10">
    {@render children()}
  </div>
</main>
