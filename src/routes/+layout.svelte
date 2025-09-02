<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import Sidebar from "$lib/components/Sidebar.svelte";

  let { children, data } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Sidebar user={data.user} />
{@render children?.()}
