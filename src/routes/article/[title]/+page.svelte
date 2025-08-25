<script lang="ts">
  import ArticleView from "$lib/components/ArticleView.svelte";
  import type { PageProps } from "./$types";

  let { data: article }: PageProps = $props();
</script>

<svelte:head>
  <title>{article.title}</title>
</svelte:head>

<main class="flex justify-center">
  <ArticleView {article} class="max-w-[75ch]" searchbar />
</main>
