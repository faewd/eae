<script lang="ts">
  import type { PageProps } from "./$types";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import Page from "$lib/components/Page.svelte";
  import NavLink from "$lib/components/NavLink.svelte";

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Search | {data.query}</title>
</svelte:head>

<Page>
  <section class="mb-10">
    <h1 class="mb-6 font-heading text-4xl font-bold text-ice-300">Search Articles</h1>
    <SearchBar query={data.query} />
  </section>
  <section>
    {#if data === null || data.results.length === 0}
      <div class="text-zinc-600 italic">No results found.</div>
    {:else}
      <div class="rounded bg-zinc-950 p-4">
        <h2 class="font-heading text-2xl font-bold text-ice-500">Results</h2>
        <ul class="mt-3 flex flex-col items-stretch gap-2">
          {#each data.results as article (article.title)}
            <li>
              <NavLink to="/wiki/{article.title}">
                <article>
                  <h3 class="font-heading text-lg font-bold text-ice-200 group-hover:text-ice-100">
                    {article.title}
                  </h3>
                  {#if article.summary}
                    <p class="leading-5 font-normal text-zinc-400 italic">{article.summary}</p>
                  {/if}
                </article>
              </NavLink>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </section>
</Page>
