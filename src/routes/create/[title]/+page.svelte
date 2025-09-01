<script lang="ts">
  import Page from "$lib/components/Page.svelte";
  import { Plus, Shell } from "@lucide/svelte";
  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();
  let { title } = params;

  let loading = $state(false);
  let error = $state(false);

  function createArticle() {
    loading = true;
    fetch("/api/articles", {
      method: "POST",
      body: JSON.stringify({ title }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (res.ok) window.location.href = `/edit/${title}`;
        else throw await res.json();
      })
      .catch((err) => {
        console.error(err);
        error = true;
        loading = false;
      });
  }
</script>

<Page>
  <h1 class="text-center font-heading text-4xl font-bold text-ice-300">Create Article</h1>
  <p class="mt-4 text-center">
    The article <span class="font-bold text-ice-100">"{title}"</span> doesn't exist yet.
  </p>
  <p class="mt-4 text-center">Would you like to create it now?</p>
  <div class="mt-8 flex justify-center">
    {#if loading}
      <Shell class="animate-spin" />
    {:else if error}
      <p class="text-rose-300 italic">Failed to create article.</p>
    {:else}
      <button
        class="hover:text-ice:100 justiy-center flex cursor-pointer items-center gap-2 rounded bg-ice-900 px-3 py-2 font-bold text-ice-200 transition-colors hover:bg-ice-800"
        onclick={createArticle}
      >
        <Plus />
        Create Article
      </button>
    {/if}
  </div>
</Page>
