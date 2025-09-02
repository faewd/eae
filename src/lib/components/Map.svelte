<script lang="ts">
  import { onMount } from "svelte";
  import "leaflet/dist/leaflet.css";
  import type { LatLng, Layer, Map } from "leaflet";
  import type { PinType } from "$lib/article/metadata";

  type Pin = {
    article: string;
    label?: string;
    desc?: string;
    coords: [number, number];
    type: PinType;
  };

  interface Props {
    name: string;
    pins: Pin[];
  }

  let { name, pins }: Props = $props();

  let L: typeof import("leaflet");
  let map: Map | null = $state(null);
  let markers: Layer[] = $state([]);
  let mouseOffset: LatLng | null = $state(null);
  let zoom = $state(2.75);

  onMount(async () => {
    L = await import("leaflet");

    map = L.map("map", {
      center: [0, 0],
      zoomControl: false,
      zoomSnap: 0,
      zoomDelta: 0.25,
      attributionControl: false,
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      maxBoundsViscosity: 1,
    }).setView([0, 0], 2.75);

    const tiles = L.tileLayer(`/map-tiles/${name}/{z}/{x}/{y}.png`, {
      maxZoom: 5,
      minZoom: zoom,
      noWrap: true,
      bounds: [
        [-90, -180],
        [90, 180],
      ],
    });
    tiles.addTo(map);

    map.on("mousemove", (e) => (mouseOffset = e.latlng));
    map.on("zoomend", () => (zoom = map?.getZoom() ?? 0));

    renderMarkers();
  });

  function renderMarkers() {
    if (map === null) return;
    markers.forEach((marker) => marker.removeFrom(map!));
    markers = pins.map((pin) => {
      const icon = L.divIcon({
        html: `<div>${pin.label ?? pin.article}</div>`,
        className:
          `map-pin pin-${pin.type} ` +
          (["region", "domain", "zone"].includes(pin.type) ? "text-pin" : "dot-pin"),
      });
      const marker = L.marker(pin.coords, { icon });
      marker.bindPopup(`
        <h1 class="font-heading font-bold text-ice-300 text-lg !mb-1">${pin.label ?? pin.article}</h1>
        ${pin.desc ? `<p class="font-sans text-zinc-300 text-md !my-0">${pin.desc}</p>` : ""}
        <div class="flex justify-end !m-0 !mt-2">
          <a target="_blank" href="/wiki/${pin.article}" class="font-sans !text-ice-300 hover:!text-ice-200 hover:underline transition-colors">
            ${pin.desc ? "Read more..." : "Read article..."}
          </a>
        </div>
      `);

      return marker;
    });
    markers.forEach((m) => m.addTo(map!));
  }
</script>

<div
  id="map"
  class="h-screen max-h-full w-screen max-w-full"
  data-zoom={Math.floor(zoom).toFixed(0)}
></div>
{#if mouseOffset}
  <div
    class="fixed right-2 bottom-2 z-[1000] rounded bg-zinc-900 p-2 font-mono text-sm text-zinc-400"
  >
    <span class="whitespace-pre">X: {mouseOffset.lat.toFixed(2).padEnd(6, " ")}</span>
    <span class="whitespace-pre">Y: {mouseOffset.lng.toFixed(2).padEnd(7, " ")}</span>
    <span class="whitespace-pre">Z: {zoom.toFixed(2).padEnd(4, " ")}</span>
  </div>
{/if}

<style>
  :global(.leaflet-container) {
    background-color: #152557;
  }

  :global(.leaflet-popup-content-wrapper) {
    background-color: var(--color-zinc-900);
    border-radius: var(--radius-md);
  }

  :global(.leaflet-popup-tip) {
    background-color: var(--color-zinc-900);
  }

  :global(.text-pin) {
    margin: 0 !important;
    padding: 0;
    background: none;
    border: none;
    box-shadow: none;
    height: 0 !important;
    width: 0 !important;
    font-family: var(--font-heading);
    white-space: wrap;
    position: relative;
    z-index: 1000 !important;
  }

  :global(.text-pin > div) {
    position: absolute;
    transform: translate(-50%, -50%);
    line-height: 1.2;
    text-align: center;
  }

  :global(.pin-region > div) {
    color: var(--color-lime-200);
    text-shadow: 2px 2px 1px rgba(0, 0, 0, 0.2);
    font-size: 2.5rem;
    font-weight: 400;
  }

  :global(.pin-domain > div) {
    color: var(--color-stone-900);
    opacity: 0.6;
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.25ch;
    text-shadow: 0px 0px 4px var(--color-lime-200);
  }

  :global(.pin-zone > div) {
    color: var(--color-stone-600);
    opacity: 0.8;
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.5ch;
    text-shadow: 0px 0px 4px var(--color-lime-200);
  }

  :global(.dot-pin) {
    margin: 0 !important;
    padding: 0;
    background: none;
    border: none;
    box-shadow: none;
  }

  :global(.dot-pin > div) {
    color: transparent;
    width: 0;
    height: 0;
    overflow: hidden;
    transform: translate(-50%, -50%);
  }

  :global(#map[data-zoom="2"] .dot-pin > div) {
    width: 0.3rem;
    height: 0.3rem;
    opacity: 0.7;
    border-radius: 100%;
  }

  :global(#map[data-zoom="2"] .dot-pin.pin-capital > div) {
    width: 0.5rem;
    height: 0.5rem;
  }

  :global(#map[data-zoom="2"] .dot-pin.pin-city > div) {
    width: 0.4rem;
    height: 0.4rem;
  }

  :global(.pin-capital > div) {
    width: 1.3rem;
    height: 1.3rem;
    transform: translate(-50%, -50%) rotate(45deg);
    background-color: var(--color-pink-900);
  }

  :global(.pin-city > div) {
    width: 1rem;
    height: 1rem;
    border-radius: 100%;
    background-color: var(--color-pink-900);
  }

  :global(.pin-town > div) {
    width: 0.5rem;
    height: 0.5rem;
    background-color: var(--color-pink-900);
  }

  :global(.pin-poi > div) {
    width: 0.5rem;
    height: 0.5rem;
    background-color: var(--color-amber-800);
    transform: translate(-50%, -50%) rotate(45deg);
  }

  :global(.pin-ruin > div) {
    width: 0.5rem;
    height: 0.5rem;
    background-color: var(--color-stone-900);
    transform: translate(-50%, -50%) rotate(45deg);
  }
</style>
