<script setup>
import { ref, onMounted, onUnmounted } from "vue";
const availableForWork = ref(false);
const currentTime = ref("");

const { data: siteStats } = await useFetch(
  "https://librecounter.org/siddharthroy.com/siteStats",
);

const visitCount = computed(() => siteStats.value?.total ?? 0);

const updateTime = () => {
  currentTime.value = new Date().toLocaleString();
};

let interval;

onMounted(() => {
  updateTime();
  interval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

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
            <p class="text-md font-mono text-zinc-400/80">@cybrchad</p>
          </div>
        </div>
        <div>
          <UBadge color="neutral" variant="soft">{{ visitCount }} Views</UBadge>
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
          <template v-if="availableForWork">
            <div class="size-1.5 rounded-full bg-[#81ff5c]"></div>
            <p class="text-xs">Available for work</p>
          </template>
          <template v-if="!availableForWork">
            <div class="size-1.5 rounded-full bg-[#ff5c5c]"></div>
            <p class="text-xs">Not Available for work</p>
          </template>
        </div>
        <div class="flex items-center justify-end">
          <time
            class="text-[10px] font-light text-zinc-500 font-mono tabular-nums tracking-wider"
            :datetime="new Date().toISOString()"
            aria-label="Current time"
          >
            {{ currentTime }}
          </time>
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
