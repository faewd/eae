<script lang="ts">
  import { page } from "$app/state";
  import SearchBar from "$lib/components/SearchBar.svelte";
</script>

<main class="flex justify-center">
  <div class="max-w-[75ch] pt-10 text-center">
    <h1 class="font-heading text-4xl font-bold text-rose-300">Error - {page.status}</h1>
    {#if page.error}
      <p class="text-xl text-rose-100 italic">{page.error?.message}</p>

      {#if page.status === 404}
        <p class="mt-10 mb-2 text-zinc-400">
          Can't find what you're looking for? Try searching for it:
        </p>
        <SearchBar />
      {/if}
    {/if}
  </div>
</main>
