<script lang="ts">
  import CreateArticleButton from "$lib/components/CreateArticleButton.svelte";
  import Page from "$lib/components/Page.svelte";
  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();
  let { title } = params;
</script>

<Page>
  <h1 class="text-center font-heading text-4xl font-bold text-ice-300">Create Article</h1>
  <p class="mt-4 text-center">
    The article <span class="font-bold text-ice-100">"{title}"</span> doesn't exist yet.
  </p>
  <p class="mt-4 mb-10 text-center">Would you like to create it now?</p>
  <CreateArticleButton {title} />
</Page>
