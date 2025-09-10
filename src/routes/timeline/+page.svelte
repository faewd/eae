<script lang="ts">
  import Page from "$lib/components/Page.svelte";
  import { Shell } from "@lucide/svelte";
  import { onMount } from "svelte";

  const pageSize = 8;

  const ORDINALS = [
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
    "Eighth",
    "Ninth",
    "Tenth",
  ];

  type Event = {
    label: string;
    era: number;
    year: number;
    desc?: string;
    article: string;
  };

  let offset = $state(0);
  let events: Event[] = $state([]);
  let loading = $state(false);
  let error: string | null = $state(null);
  let end = $state(false);

  $effect(() => {
    loading = true;
    fetch(`/api/events?limit=${pageSize}&offset=${offset}`)
      .then(async (res) => {
        if (!res.ok) throw await res.json();
        return res.json();
      })
      .then((data) => {
        events = events.concat(...data.events);
        if (data.events.length < pageSize) end = true;
        error = null;
      })
      .catch((err) => {
        error = `${err}`;
      })
      .finally(() => {
        loading = false;
      });
  });

  let scrollSensor: HTMLElement;
  onMount(() => {
    const main = document.querySelector("main")!;

    const onScroll = () => {
      if (end) return;
      const sensor = scrollSensor.getBoundingClientRect();
      const screen = window.document.body.getBoundingClientRect();
      if (sensor.top < screen.bottom && !loading) offset += pageSize;
    };

    main.addEventListener("scroll", onScroll);

    return () => main.removeEventListener("scroll", onScroll);
  });
</script>

<svelte:head>
  <title>Timeline | Auriin Wiki</title>
</svelte:head>

<Page>
  <h1 class="font-heading text-4xl font-bold text-ice-300">Timeline</h1>
  <section class="mt-8 mb-8">
    <ol
      class="relative w-full ps-8 before:absolute before:left-2 before:block before:h-full before:w-1 before:rounded before:bg-ice-400/20 lg:ps-0 lg:before:left-1/2 lg:before:-translate-x-1/2"
    >
      {#each events as event, i (i)}
        {#if (events[i - 1]?.era ?? 0) < event.era}
          <div
            class="relative mt-8 mb-2 h-10 text-center font-heading text-3xl font-bold text-ice-300 before:absolute before:top-1/2 before:box-content before:block before:h-1 before:w-full before:-translate-y-1/2 before:rounded before:border-4 before:border-zinc-900 before:bg-ice-900 lg:px-4 lg:before:-ml-4 lg:odd:text-left lg:even:text-right"
          >
            <span class="relative bg-zinc-900 px-4" id="{ORDINALS[event.era - 1]}-era">
              {ORDINALS[event.era - 1]} Era
            </span>
          </div>
        {/if}
        <li
          class="relative mb-4 rounded bg-zinc-950 p-4 before:absolute before:top-1/2 before:left-[calc(-8.5*var(--spacing))] before:block before:size-6 before:-translate-y-1/2 before:rounded-lg before:border-2 before:border-zinc-900 before:bg-ice-700 lg:w-[calc(50%-8*var(--spacing))] lg:before:-right-8 lg:before:left-[calc(100%+8*var(--spacing))] lg:before:-translate-x-1/2 lg:even:left-[calc(50%+8*var(--spacing))] lg:even:before:-left-8"
        >
          <p class="text-sm text-zinc-400">
            {event.era}e<span class="font-bold text-ice-700">{event.year}</span>
          </p>
          <h2 class="font-heading text-xl font-bold text-ice-300">{event.label}</h2>
          {#if event.desc}
            <p>{event.desc}</p>
          {/if}
          <p class="text-right">
            <a href="/wiki/{event.article}" class="wikilink">Read more...</a>
          </p>
        </li>
      {/each}
    </ol>
  </section>
  <section bind:this={scrollSensor} class="pb-8">
    <div class="flex justify-center">
      {#if loading}
        <Shell class="animate-spin" />
      {:else if end}
        <p class="text-zinc-400 italic">You decide what happens next...</p>
      {:else}
        <p class="text-zinc-400 italic">Scroll to load more.</p>
      {/if}
    </div>
    {#if error}
      <p class="text-red-300 italic">{error}</p>
    {/if}
  </section>
</Page>
