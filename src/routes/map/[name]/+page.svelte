<script lang="ts">
  import type { PageProps } from "./$types";
  import Map from "$lib/components/Map.svelte";

  let { params }: PageProps = $props();
</script>

<div class="h-screen max-h-full w-screen max-w-full bg-[#152557]">
  <Map name={params.name} />
</div>
