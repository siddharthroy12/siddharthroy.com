<script lang="ts" setup>
const items = [
  "/gallery/1.jpg",
  "/gallery/2.jpg",
  "/gallery/3.jpeg",
  "/gallery/4.jpeg",
  "/gallery/5.jpeg",
  "/gallery/6.webp",
];
</script>
<template>
  <div class="h-[284px]">
    <UCarousel
      v-slot="{ item }"
      loop
      orientation="horizontal"
      auto-scroll
      :ui="{
        controls: 'absolute top-[20px] inset-x-20',
      }"
      :items="items"
      class="w-full max-w-xs mx-auto"
    >
      <img :src="item" width="320" height="320" class="rounded-lg" />
    </UCarousel>
  </div>
</template>
