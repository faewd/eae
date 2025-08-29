<script lang="ts">
  import { onMount } from "svelte";
  import Map from "ol/Map";
  import TileLayer from "ol/layer/Tile";
  import View from "ol/View";
  import XYZ from "ol/source/XYZ";

  interface Props {
    name: string;
  }

  let { name }: Props = $props();

  onMount(() => {
    new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new XYZ({
            url: `/map-tiles/${name}/{z}/{x}/{y}.png`,
          }),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
        maxZoom: 5,
        minZoom: 0,
      }),
    });
  });
</script>

<div id="map" class="h-screen max-h-full w-screen max-w-full"></div>
