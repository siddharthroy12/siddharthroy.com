<script setup>
import { ref } from "vue";

const projects = ref([
  {
    title: "Noa",
    description: "Lightweight, embeddable scripting language",
    link: "https://github.com/siddharthroy12/noa",
  },
  {
    title: "GlobeChat",
    description: "Chats on world map",
    link: "https://globechat.live/",
  },
  {
    title: "Timebrew",
    description: "A personal time tracker",
    link: "https://github.com/siddharthroy12/timebrew",
  },
  {
    title: "Gravity sandbox",
    description: "2D Newtonian gravity simulator",
    link: "https://github.com/siddharthroy12/noa",
  },
  {
    title: "Rockets",
    description: "Dodge rockets in retro style",
    link: "https://www.lexaloffle.com/bbs/?pid=111184",
  },
]);
</script>

<template>
  <div class="flex flex-col">
    <h1
      class="text-5xl font-extrabold py-2 px-2.5 pt-0 relative w-full break-all"
    >
      PROJECTS
    </h1>
    <Card>
      <div class="px-2 py-2 flex flex-col gap-2">
        <a
          class="block"
          v-for="project in projects"
          :key="project.title"
          :href="project.link"
        >
          <UCard :ui="{ body: '!p-[10px]' }" class="hover:bg-elevated">
            <div class="flex gap-3">
              <div
                class="w-[50px] h-[50px] rounded-2xl bg-primary flex items-center justify-center"
              >
                <UIcon name="i-lucide-link" class="size-5 text-inverted" />
              </div>
              <div>
                <p class="text-highlighted font-semibold">
                  {{ project.title }}
                </p>
                <p>{{ project.description }}</p>
              </div>
            </div>
          </UCard>
        </a>
      </div>
    </Card>
  </div>
</template>
