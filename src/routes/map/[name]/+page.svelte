<script lang="ts">
  import type { PageProps } from "./$types";
  import Map from "$lib/components/Map.svelte";

  let { params, data }: PageProps = $props();
</script>

<svelte:head>
  <title>Map Viewer | {params.name}</title>
</svelte:head>

<div class="h-screen max-h-full w-screen max-w-full bg-[#152557]">
  <Map name={params.name} pins={data.pins} />
</div>
