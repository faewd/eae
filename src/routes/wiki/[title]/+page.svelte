<script lang="ts">
  import ArticleView from "$lib/components/ArticleView.svelte";
  import Page from "$lib/components/Page.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let { user, article } = data;
</script>

<svelte:head>
  <title>{article.title}</title>
</svelte:head>

<Page>
  <ArticleView {article} searchbar editable={user?.isAdmin} />
</Page>
