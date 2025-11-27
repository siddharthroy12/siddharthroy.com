<script setup lang="ts">
import ProfileCard from "~/components/profile-card.vue";
import Experience from "~/components/experience.vue";
import Projects from "~/components/projects.vue";
import Links from "~/components/links.vue";
import Fidget from "~/components/fidget.vue";
</script>

<template>
  <div
    class="flex items-center justify-center max-sm:flex-col sm:flex-row bg-transparent w-full"
  >
    <div class="flex gap-3 max-w-[984px] p-5 max-sm:p-4">
      <div class="flex flex-col gap-3 w-full">
        <Experience />
      </div>
      <div class="flex flex-col gap-3 w-[486px] shrink-0">
        <ProfileCard />
        <Projects />
      </div>
      <div class="flex flex-col gap-3 w-full">
        <Links />
        <Fidget />
      </div>
    </div>

    <!-- <div
      class="grid gap-3 grid-cols-1 sm:grid-cols-8 sm:grid-rows-5 p-5 max-sm:p-4 sm:h-[770px] relative w-full max-sm:gap-3 max-sm:min-h-screen"
    >
      <ProfileCard />
      <Experience />
      <Projects />
      <Fidget />
      <Links />
    </div> -->
  </div>
</template>
