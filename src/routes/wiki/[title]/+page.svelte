<script lang="ts">
  import ArticleView from "$lib/components/ArticleView.svelte";
  import type { PageProps } from "./$types";

  let { data: article }: PageProps = $props();
</script>

<svelte:head>
  <title>{article.title}</title>
</svelte:head>

<main class="flex h-screen max-h-full justify-center">
  <ArticleView {article} class="max-w-[75ch]" searchbar />
</main>
