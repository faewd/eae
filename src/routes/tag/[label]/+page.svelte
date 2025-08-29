<script lang="ts">
  import NavLink from "$lib/components/NavLink.svelte";
  import Page from "$lib/components/Page.svelte";
  import { Tag } from "@lucide/svelte";

  let { data } = $props();
</script>

<Page>
  <h1 class="class mb-8 flex items-center gap-2 font-heading text-4xl font-bold text-ice-300">
    <Tag class="text-[4rem] text-ice-800" />
    {data.tag}
  </h1>
  <section>
    <h2 class="mb-2 border-b-2 border-ice-800 font-heading text-2xl font-bold text-ice-300">
      Articles
    </h2>
    {#if data.articles.length > 0}
      <ul class="mt-2 flex flex-col items-stretch gap-2 rounded bg-zinc-950 p-4">
        {#each data.articles as article (article.title)}
          <li>
            <NavLink to={`/wiki/${article.title}`}>
              {article.title}
            </NavLink>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="rounded bg-ice-300/10 p-4 text-ice-200">
        No Articles are tagged with "{data.tag}".
      </div>
    {/if}
  </section>
  <section class="mt-8">
    <h2 class="mb-2 border-b-2 border-ice-800 font-heading text-2xl font-bold text-ice-300">
      Related Tags
    </h2>
    {#if data.related.length > 0}
      <ul class="mt-2 flex flex-col items-stretch gap-2 rounded bg-zinc-950 p-4">
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
      <div class="rounded bg-ice-300/10 p-4 text-ice-200">
        No other tags are used on the same articles as "{data.tag}".
      </div>
    {/if}
  </section>
</Page>
