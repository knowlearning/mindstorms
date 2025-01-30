<script setup>
  import Image from './image.vue'

  const props = defineProps({ uuid: String })
  const mindstorm = await Agent.state(props.uuid)
  console.log(mindstorm, props.uuid)
</script>

<template>
  <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <Image
      v-for="{ dimensions, angle, origin, sprite }, name in mindstorm"
      :key="sprite"
      @mousedown.stop="selected = name"
      svg
      :selected="selected === name"
      :uuid="sprite"
      :dimensions="dimensions"
      :transform="`rotate(${angle}, ${origin.x}, ${origin.y})`"
    />
    <rect
      x="0"
      y="0"
      style="pointer-events: none;"
      width="100"
      height="100"
      fill="none"
      stroke-width="0.5"
      stroke="black"
      rx="2"
    />
  </svg>
</template>