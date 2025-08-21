<script lang="ts">
  import { ArrowBigRight } from "@lucide/svelte";

  interface Props {
    show: boolean;
    new: string;
    old: string;
    onconfirm: () => void;
  }

  let { show = $bindable(), new: newTitle, old: oldTitle, onconfirm }: Props = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    if (show) dialog.showModal();
    else dialog.close();
  });

  function confirm() {
    show = false;
    onconfirm();
  }
</script>

<dialog
  bind:this={dialog}
  onclose={() => (show = false)}
  class="h-full w-full bg-transparent backdrop:bg-zinc-950/50 backdrop:backdrop-blur"
>
  <div class="flex h-full w-full items-center justify-center">
    <div class="rounded-lg bg-zinc-900 p-4 text-zinc-300">
      <h1 class="mb-3 text-2xl text-ice-300">Rename Article</h1>
      <p>You are trying to rename this article.</p>
      <div class="my-4 flex items-center justify-center gap-8 text-2xl text-ice-200">
        {oldTitle}
        <ArrowBigRight class="text-ice-600" />
        {newTitle}
      </div>
      <p class="mb-3">
        This <strong>WILL</strong> break other articles that currently link to this one.
      </p>
      <p class="mb-3">Are you sure you want to rename the article?</p>
      <div class="flex items-stretch justify-end gap-4">
        <button
          class="cursor-pointer rounded bg-zinc-950 p-2 font-bold transition-colors hover:bg-zinc-800"
          onclick={() => (show = false)}>Cancel</button
        >
        <button
          class="cursor-pointer rounded bg-ice-800 p-2 font-bold text-zinc-200 transition-colors hover:bg-ice-700"
          onclick={confirm}>Rename</button
        >
      </div>
    </div>
  </div>
</dialog>
