<script>
import FlickeringGrid from "~/components/flickering-grid.vue";
</script>

<template>
  <main
    class="min-h-screen flex items-center justify-center relative mx-auto max-w-5xl z-10"
  >
    <slot />
  </main>

  <!-- Rotate this background in 3D space -->
  <div class="w-dvw h-dvh fixed top-0 opacity-10 perspective-1000">
    <div class="animate-3d-rotation w-full h-full">
      <FlickeringGrid />
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.animate-3d-rotation {
  transform-style: preserve-3d;
  transform: rotateX(19deg) rotateY(20deg) translate(200px, -200px) scale(1.5);
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0) 100%
  );
  -webkit-mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0) 100%
  );
}
</style>
