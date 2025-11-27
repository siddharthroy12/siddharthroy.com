<template>
  <Card>
    <div
      class="flex flex-col overflow-hidden h-[250px] size-full relative z-10 p-5 items-start justify-start gap-8 max-sm:h-[275px] max-sm:gap-4"
    >
      <div class="w-full flex justify-between items-start">
        <div class="flex gap-3">
          <img
            alt="profile"
            loading="lazy"
            width="1024"
            height="1024"
            decoding="async"
            src="~/assets/profile.jpeg"
            data-nimg="1"
            class="size-16 rounded-3xl opacity-90 dark:opacity-100"
            style="color: transparent"
          />
          <div class="">
            <p class="font-bold text-lg">Siddharth Roy.</p>
            <p class="text-md font-mono text-zinc-400/80">@cyberchad</p>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-1 overflow-hidden">
        <div class="font-bold w-full flex items-center justify-start gap-1">
          <p class="inline text-lg">I write softwares.</p>
        </div>
        <div class="font-bold w-full flex items-center justify-start gap-1">
          <p class="inline text-lg">Web Apps, Mobile Apps, Automation, etc.</p>
        </div>
      </div>
      <div class="absolute bottom-5 right-5 b">
        <div
          class="font-mono flex justify-end items-center gap-1 text-sm text-zinc-400"
        >
          <div class="size-1.5 rounded-full bg-[#ff5c5c]"></div>
          <p class="text-xs">Not Available for work</p>
        </div>
        <div class="flex items-center justify-center">
          <time
            class="text-[10px] font-light text-zinc-500 font-mono tabular-nums tracking-wider"
            datetime="2025-11-26T13:42:16.291Z"
            aria-label="Current time"
            >11/26/2025, 07:12:16 PM</time
          >
        </div>
      </div>
      <div class="absolute bottom-5 left-5 max-sm:hidden">
        <div class="w-full">
          <p class="text-xs font-mono text-zinc-400/70">
            I watch anime and play <br />
            games in my free time.
          </p>
        </div>
      </div>
    </div>
  </Card>
</template>
