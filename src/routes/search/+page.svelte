<script lang="ts">
  import { ArrowRight } from "@lucide/svelte";
  import type { PageProps } from "./$types";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import Page from "$lib/components/Page.svelte";

  let { data }: PageProps = $props();
</script>

<Page>
  <section>
    <h1 class="mb-6 font-heading text-4xl font-bold text-ice-300">Search Articles</h1>
    <SearchBar query={data?.query} />
  </section>
  <section>
    <h2 class="mt-8 mb-4 font-heading text-2xl font-bold text-ice-600">Results</h2>
    {#if data === null || data.results.length === 0}
      <div class="text-zinc-600 italic">No results found.</div>
    {:else}
      <ol class="flex flex-col gap-2">
        {#each data.results as article (article.title)}
          <li>
            <a href={"/wiki/" + encodeURIComponent(article.title)}>
              <article
                class="group flex justify-between rounded bg-zinc-800 p-2 transition-colors hover:bg-zinc-700"
              >
                <h3 class="font-heading font-bold text-ice-200 group-hover:text-ice-100">
                  {article.title}
                </h3>
                <ArrowRight
                  class="translate-x-3 text-ice-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                />
              </article>
            </a>
          </li>
        {/each}
      </ol>
    {/if}
  </section>
</Page>
