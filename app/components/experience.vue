<script setup lang="ts">
const items = ref([
  {
    date: "Mar 15, 2025",
    title: "Project Kickoff",
    description:
      "Kicked off the project with team alignment. Set up project milestones and allocated resources.",
    icon: "i-lucide-code",
  },
  {
    date: "Mar 22 2025",
    title: "Design Phase",
    description:
      "User research and design workshops. Created wireframes and prototypes for user testing.",
    icon: "i-lucide-code",
  },
]);
</script>

<template>
  <div class="flex flex-col w-full">
    <h1 class="text-5xl font-extrabold py-2 relative w-full break-all">
      EXPERIE<br />NCE
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
