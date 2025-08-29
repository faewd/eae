<script>
  import {
    BookMarked,
    BowArrow,
    Calendar,
    Flag,
    House,
    MapPin,
    PanelLeftClose,
    PanelLeftOpen,
    PersonStanding,
    Sparkles,
    Tags,
    Users,
  } from "@lucide/svelte";
  import SearchBar from "./SearchBar.svelte";
  import cx from "$lib/utils/cx";
  import { beforeNavigate } from "$app/navigation";
  import NavLink from "./NavLink.svelte";

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
      <section class="mt-4">
        <ul class="flex flex-col gap-2">
          <li>
            <NavLink to="/">
              <House />
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/tags">
              <Tags />
              Tag Viewer
            </NavLink>
          </li>
        </ul>
      </section>
      <section class="mt-4">
        <h3 class="mb-2 border-b-2 border-ice-800 font-heading text-xl font-bold text-ice-300">
          Lore
        </h3>
        <ul class="flex flex-col gap-2">
          <li>
            <NavLink to="/tag/Character">
              <Users class="text-ice-200" />
              Characters
            </NavLink>
          </li>
          <li>
            <NavLink to="/wiki/Deities">
              <Sparkles class="text-violet-200" />
              Deities
            </NavLink>
          </li>
          <li>
            <NavLink to="/tag/Faction">
              <Flag class="text-rose-200" />
              Factions
            </NavLink>
          </li>
          <li>
            <NavLink to="/tag/Location">
              <MapPin class="text-amber-100" />
              Locations
            </NavLink>
          </li>
          <li>
            <NavLink to="/wiki/Divine Calendar">
              <Calendar class="text-lime-100" />
              Calendar
            </NavLink>
          </li>
        </ul>
      </section>
      <section class="mt-4">
        <h3 class="mb-2 border-b-2 border-ice-800 font-heading text-xl font-bold text-ice-300">
          Character Options
        </h3>
        <ul class="flex flex-col gap-2">
          <li>
            <NavLink to="/tag/Class">
              <BowArrow class="text-emerald-200" />
              Classes
            </NavLink>
          </li>
          <li>
            <NavLink to="/tag/Player Race">
              <PersonStanding class="-mx-1 -my-4 size-8 text-cyan-200" />
              Races
            </NavLink>
          </li>
          <li>
            <NavLink to="/tag/Background">
              <BookMarked class="text-blue-200" />
              Backgrounds
            </NavLink>
          </li>
        </ul>
      </section>
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
