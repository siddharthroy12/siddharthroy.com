<script setup lang="ts">
const items = ref([
  {
    date: "Apr 15 2024 - Present",
    title: "Algo One",
    description:
      "Built frontends for various clients as well as a full-stack application for proctored test and mobile app for GQFinXray.",
    icon: "i-lucide-code",
  },
  {
    date: "October 25, 2022 - 2024",
    title: "Everlytics",
    description:
      "Worked as an intern frontend developer. Built dashboards for internal and client projects with E2E automated testing.",
    icon: "i-lucide-code",
  },
]);
</script>

<template>
  <div class="flex flex-col w-full">
    <h1 class="text-5xl font-extrabold py-2 relative pt-0 w-full break-all">
      EXPERIE<br class="max-[950px]:hidden" />NCE
    </h1>
    <Card>
      <div class="overflow-y-scroll">
        <div class="px-2 py-3">
          <UTimeline :items="items" :default-value="items.length" />
        </div>
      </div>
    </Card>
  </div>
</template>
