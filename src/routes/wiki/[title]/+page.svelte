<script lang="ts">
  import ArticleView from "$lib/components/ArticleView.svelte";
  import Page from "$lib/components/Page.svelte";
  import type { PageProps } from "./$types";

  let { data: article }: PageProps = $props();
</script>

<svelte:head>
  <title>{article.title}</title>
</svelte:head>

<Page>
  <ArticleView {article} searchbar editable />
</Page>
