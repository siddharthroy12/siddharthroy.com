<script setup>
defineProps({
  fullHeight: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    :class="[
      'border border-[#212022] p-0.5 rounded-xl w-full',
      fullHeight && 'h-full',
    ]"
  >
    <div
      :class="[
        'bg-[#111010] border border-[#27272A] rounded-[10px] overflow-hidden w-full',
        fullHeight && 'h-full',
      ]"
    >
      <div
        :class="[
          '[box-shadow:0_0px_60px_-20px_#ffffff1f_inset] w-full',
          fullHeight && 'h-full',
        ]"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
