<script>
  import { PanelLeftClose, PanelLeftOpen } from "@lucide/svelte";
  import SearchBar from "./SearchBar.svelte";
  import cx from "$lib/utils/cx";
  import { beforeNavigate } from "$app/navigation";

  let visible = $state(false);

  beforeNavigate(() => {
    visible = false;
  });
</script>

<aside
  class={cx("pointer-events-none fixed z-100 h-screen w-screen transition-all", {
    "bg-zinc-900/20 backdrop-blur": visible,
  })}
>
  <div
    class={cx(
      "pointer-events-auto relative top-0 h-screen w-fit -translate-x-full bg-zinc-950 p-4 transition-transform",
      {
        "translate-x-0": visible,
      },
    )}
  >
    <header>
      <h2 class="mb-4 flex items-center justify-between text-2xl font-bold">
        <span class="font-heading text-4xl text-ice-300">Æ</span>
        Menu
      </h2>
      <SearchBar inputClass="bg-zinc-800" />
    </header>

    <button
      class="absolute top-0 -right-12 flex size-12 cursor-pointer items-center justify-center rounded-br bg-zinc-950 text-ice-300 transition-colors hover:bg-ice-950"
      onclick={() => (visible = !visible)}
    >
      <div class="relative size-6">
        <PanelLeftOpen
          class={cx("absolute rotate-0 opacity-100 transition-all duration-500", {
            "rotate-180 opacity-0": visible,
          })}
        />
        <PanelLeftClose
          class={cx("absolute rotate-180 opacity-0 transition-all duration-500", {
            "rotate-360 opacity-100": visible,
          })}
        />
      </div>
    </button>
  </div>
</aside>
