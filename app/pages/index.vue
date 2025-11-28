<script setup lang="ts">
import ProfileCard from "~/components/profile-card.vue";
import Experience from "~/components/experience.vue";
import Projects from "~/components/projects.vue";
import Links from "~/components/links.vue";
import Fidget from "~/components/fidget.vue";
</script>

<template>
  <div
    class="min-[722px]:flex flex-row hidden items-center justify-center bg-transparent w-full"
  >
    <div class="flex gap-3 max-w-[984px] p-5 max-sm:p-4">
      <div class="max-[950px]:hidden flex flex-col gap-3 w-full">
        <Experience />
      </div>
      <div
        class="flex flex-col gap-3 max-[950px]:w-[416px] min-[950px]:w-[486px] shrink-0"
      >
        <ProfileCard />
        <Projects />
      </div>
      <div class="flex flex-col gap-3 w-full">
        <div class="max-[950px]:block hidden">
          <Experience />
        </div>
        <Links />

        <Fidget />
      </div>
    </div>
  </div>
  <div class="min-[722px]:hidden flex flex-col">
    <div class="flex flex-col gap-3 max-w-[984px] p-5 max-sm:p-4">
      <ProfileCard />
      <Links />
      <Projects />
      <Experience />
      <Fidget />
    </div>
  </div>
</template>
