<script lang="ts">
  import { onMount } from "svelte";
  import "leaflet/dist/leaflet.css";

  interface Props {
    name: string;
  }

  let { name }: Props = $props();

  onMount(async () => {
    const { Map, TileLayer } = await import("leaflet");
    const map = new Map("map", {
      center: [0, 0],
      zoomControl: false,
      zoomSnap: 0,
      zoomDelta: 0.25,
      attributionControl: false,
      maxBounds: [
        [-100, -180],
        [100, 180],
      ],
      maxBoundsViscosity: 1,
    }).setView([0, 0], 2.75);

    const tiles = new TileLayer(`/map-tiles/${name}/{z}/{x}/{y}.png`, {
      maxZoom: 5,
      minZoom: 2.75,
      noWrap: true,
      bounds: [
        [-100, -180],
        [100, 180],
      ],
    });
    tiles.addTo(map);
  });
</script>

<div id="map" class="h-screen max-h-full w-screen max-w-full"></div>

<style>
  :global(.leaflet-container) {
    background-color: #152557;
  }
</style>
