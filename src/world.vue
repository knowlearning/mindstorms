<script setup>
  import { ref, reactive } from 'vue'
  import Image from './image.vue'

  const props = defineProps({ uuid: String })

  const mindstorm = JSON.parse(JSON.stringify(await Agent.state(props.uuid)))
  const world = reactive(await Agent.state(`run-state/${props.uuid}`))
  const svg = ref(null)

  Object.keys(world).forEach(key => delete world[key])
  Object.assign(world, mindstorm)

  function handleClick(name, rawEvent) {
    const handler = world?.[name]?.handlers?.click
    if (handler) {
      try {
        const event = {}
        const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
        const result = scopedHandler.bind(world[name])(world, event)
      } catch (error) {
        console.error('Error:', error.message)
      }
    }
  }

  function handleDrag(name, { detail: { svg_x:x, svg_y:y, svg_dx:dx, svg_dy:dy } }) {
    const handler = world?.[name]?.handlers?.drag
    if (handler) {
      try {
        const event = { x, y, dx, dy }
        const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
        const result = scopedHandler.bind(world[name])(world, event)
      } catch (error) {
        console.error('Error:', error.message)
      }
    }
  }
</script>

<template>
  <svg
    ref="svg"
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid meet"
  >
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
        v-drag
        @drag="event => handleDrag(name, event)"
        @click="event => handleClick(name, event)"
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