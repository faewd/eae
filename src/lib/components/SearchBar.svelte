<script lang="ts">
  import cx from "$lib/utils/cx";
  import { Search } from "@lucide/svelte";

  interface Props {
    query?: string | null;
    class?: string;
  }

  let { query, class: className }: Props = $props();
</script>

<form class={cx("flex w-full gap-2", className)} method="GET" action="/search">
  <input type="text" name="q" class="flex-grow rounded bg-zinc-950 px-2 py-1" value={query ?? ""} />
  <button
    type="submit"
    class="cursor-pointer rounded bg-ice-900 p-2 text-ice-300 transition-colors hover:bg-ice-800"
  >
    <Search />
  </button>
</form>
