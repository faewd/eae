<script lang="ts">
  import fancyRule from "$lib/assets/fancy-rule.png";
  import enna from "$lib/assets/Enna Berevian.png";
</script>

<main class="flex h-screen max-h-full items-center justify-center">
  <div class="flex flex-col-reverse items-center gap-8 p-4 sm:p-10 lg:flex-row">
    <div class="prose flex-1 flex-shrink text-center prose-zinc prose-invert">
      <h1
        class="sm:mv-3 mb-2 font-heading text-[3rem] font-normal text-ice-300 sm:text-[4rem] xl:mb-4 xl:text-[5rem]"
      >
        Enna's&nbsp;Auriinic<br />Encyclopædia
      </h1>
      <img
        src={fancyRule}
        alt="horizontal rule"
        class="!m-0 inline max-h-4 sm:max-h-6 xl:max-h-12"
      />
      <p>
        Enna's Auriinic Encyclopædia is a comprehensive guide to the Auriin campaign setting for
        <span class="text-red-300">Dungeons &amp; Dragons</span>, drawn straight from the notes of
        <a
          href="/wiki/Enna Berevian"
          class="text-ice-200 no-underline transition-colors hover:text-ice-100 hover:underline"
          >Enna Berevian</a
        >. Enna is one of few Eladrin who walk the Prime Material Plane, of whom she is the oldest
        and perhaps the most erudite.
      </p>
    </div>
    <img
      src={enna}
      alt="Enna Berevian, dressed in a heavy fur cloak, decorative hunting gear, and wielding a bow. She is weeping."
      class="h-100 lg:h-[unset] lg:max-h-[70vh] xl:max-h-[80vh]"
    />
  </div>
</main>
