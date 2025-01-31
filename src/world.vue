<script setup>
  import { reactive } from 'vue'
  import Image from './image.vue'

  const props = defineProps({ uuid: String })

  const mindstorm = JSON.parse(JSON.stringify(await Agent.state(props.uuid)))
  const world = reactive(await Agent.state(`run-state/${props.uuid}`))

  Object.keys(world).forEach(key => delete world[key])
  Object.assign(world, mindstorm)

  function handleClick(name) {
    const clickHandler = world?.[name]?.handlers?.click
    if (clickHandler) {
      try {
        const result = (new Function('world', `with (world) { ${clickHandler} }`))(world)
      } catch (error) {
        console.error('Error:', error.message)
      }
    }
  }
</script>

<template>
  <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <defs>
      <clipPath id="myClip">
        <rect x="0" y="0" width="100" height="100" rx="2" />
      </clipPath>
    </defs>
    <rect
      x="0"
      y="0"
      style="pointer-events: none;"
      width="100"
      height="100"
      fill="white"
      stroke-width="0.5"
      stroke="black"
      rx="2"
    />
    <g clip-path="url(#myClip)">
      <Image
        v-for="{ dimensions, angle, origin, sprite }, name in world"
        :key="sprite"
        @click="handleClick(name)"
        svg
        :uuid="sprite"
        :dimensions="dimensions"
        :transform="`rotate(${angle}, ${origin.x}, ${origin.y})`"
      />
    </g>
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