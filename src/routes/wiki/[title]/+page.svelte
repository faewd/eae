<script lang="ts">
  import ArticleView from "$lib/components/ArticleView.svelte";
  import Page from "$lib/components/Page.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let { user, article } = $derived(data);

  let page: Page;
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    article;
    page.resetScroll();
  });
</script>

<svelte:head>
  <title>{article.title}</title>
</svelte:head>

<Page bind:this={page}>
  <ArticleView {article} searchbar editable={user?.isAdmin} />
</Page>
