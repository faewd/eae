<script lang="ts">
  interface Props {
    show: boolean;
    title: string;
    onsave: () => void;
    ondiscard: () => void;
  }

  let { show = $bindable(), title, onsave, ondiscard }: Props = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    if (show) dialog.showModal();
    else dialog.close();
  });

  function save() {
    show = false;
    onsave();
  }

  function discard() {
    show = false;
    ondiscard();
  }
</script>

<dialog
  bind:this={dialog}
  onclose={() => (show = false)}
  class="h-full w-full bg-transparent backdrop:bg-zinc-950/50 backdrop:backdrop-blur"
>
  <div class="flex h-full w-full items-center justify-center">
    <div class="rounded-lg bg-zinc-900 p-4 text-zinc-300">
      <h1 class="mb-3 text-2xl text-ice-300">Save Changes to {title}?</h1>
      <p class="mb-3">You have unsaved changes.</p>
      <p>If you quit without saving, your work will be lost.</p>
      <div class="mt-4 flex items-stretch justify-end gap-2">
        <button
          class="cursor-pointer rounded bg-zinc-950 p-2 font-bold transition-colors hover:bg-zinc-800"
          onclick={() => (show = false)}>Cancel</button
        >
        <button
          class="cursor-pointer rounded bg-rose-900 p-2 font-bold text-zinc-200 transition-colors hover:bg-rose-800"
          onclick={discard}>Discard</button
        >
        <button
          class="cursor-pointer rounded bg-ice-800 p-2 font-bold text-zinc-200 transition-colors hover:bg-ice-700"
          onclick={save}>Save</button
        >
      </div>
    </div>
  </div>
</dialog>
