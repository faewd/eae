<script lang="ts">
  import NavLink from "$lib/components/NavLink.svelte";
  import Page from "$lib/components/Page.svelte";
  import { Tag } from "@lucide/svelte";

  let { data } = $props();
</script>

<svelte:head>
  <title>Tag | {data.tag}</title>
</svelte:head>

<Page>
  <h1 class="class mb-8 flex items-center gap-2 font-heading text-4xl font-bold text-ice-300">
    <Tag class="text-[4rem] text-ice-800" />
    {data.tag}
  </h1>
  <section class="rounded bg-zinc-950 p-4">
    <h2 class="font-heading text-2xl font-bold text-ice-500">Articles Tagged with: {data.tag}</h2>
    {#if data.articles.length > 0}
      <ul class="mt-3 flex flex-col items-stretch gap-2">
        {#each data.articles as article (article.title)}
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
    {:else}
      <div class="mt-3 rounded bg-ice-300/10 p-4 text-ice-200">
        No Articles are tagged with "{data.tag}".
      </div>
    {/if}
  </section>
  <section class="mt-8 rounded bg-zinc-950 p-4">
    <h2 class="font-heading text-2xl font-bold text-ice-500">Related Tags</h2>
    {#if data.related.length > 0}
      <ul class="mt-3 flex flex-col items-stretch gap-2">
        {#each data.related as tag (tag.label)}
          <li>
            <NavLink to={`/tag/${tag.label}`}>
              {tag.label}
              <span class="text-sm text-zinc-500 italic">
                ({tag.count} common article{tag.count > 1 ? "s" : ""})
              </span>
            </NavLink>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="mt-3 rounded bg-ice-300/10 p-4 text-ice-200">
        No other tags are used on the same articles as "{data.tag}".
      </div>
    {/if}
  </section>
</Page>
