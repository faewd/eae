<script lang="ts">
  import NavLink from "$lib/components/NavLink.svelte";
  import Page from "$lib/components/Page.svelte";
  import { ArrowLeft, ArrowRight } from "@lucide/svelte";

  type Tag = {
    label: string;
    usages: string;
  };

  let tags: { page: Tag[]; total: number } | null = $state(null);
  let error: string | null = $state(null);
  let page = $state(0);
  let pageSize = $state(25);
  let maxPage = $derived.by(() => Math.floor((tags?.total ?? 0) / pageSize));

  $effect(() => {
    fetch(`/api/tags?page=${page}&size=${pageSize}`)
      .then(async (res) => {
        if (res.ok) return res.json();
        throw await res.text();
      })
      .then((data) => {
        tags = data.tags;
        error = null;
      })
      .catch((err) => {
        error = `${err}`;
      });
  });
</script>

<Page>
  <h1 class="mb-8 font-heading text-4xl font-bold text-ice-300">Tags</h1>

  <section>
    <h2 class="mb-4 border-b-2 border-ice-800 font-heading text-2xl font-bold text-ice-300">
      All Tags
    </h2>
    {#if error !== null}
      {error}
    {:else if tags === null}
      Loading...
    {:else}
      <ul class="flex flex-col gap-2 rounded bg-zinc-950 p-4">
        {#each tags.page as tag (tag.label)}
          <li>
            <NavLink to={`/tag/${tag.label}`} class="py-2">
              <div class="flex items-center gap-4">
                <div class="">{tag.label}</div>
                <div class="text-sm font-normal text-zinc-500">{tag.usages} article</div>
              </div>
            </NavLink>
          </li>
        {/each}
      </ul>
      <div class="mt-2 flex rounded bg-zinc-950 p-4 text-zinc-500">
        <div>
          Showing {Math.min(tags.page.length, pageSize)} of {tags.total} entries.
        </div>
        <div class="ml-auto flex items-center gap-2">
          {#if page > 0}
            <button
              class="flex size-8 cursor-pointer items-center justify-center rounded-sm bg-ice-950 p-1 text-ice-300 transition-colors hover:bg-ice-900"
              onclick={() => (page -= 1)}
            >
              <ArrowLeft />
            </button>
          {/if}
          <span>{page + 1}/{maxPage + 1}</span>
          {#if page < maxPage}
            <button
              class="flex size-8 cursor-pointer items-center justify-center rounded-sm bg-ice-950 p-1 text-ice-300 transition-colors hover:bg-ice-900"
              onclick={() => (page += 1)}
            >
              <ArrowRight />
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </section>

  <section class="mt-12">
    <h2 class="mb-4 border-b-2 border-ice-800 font-heading text-2xl font-bold text-ice-300">
      Untagged Articles
    </h2>
  </section>
</Page>
