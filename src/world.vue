<script setup>
  import { ref, reactive } from 'vue'
  import Image from './image.vue'
  import { useAnimationLoop } from './animation-loop.js'

  const props = defineProps({ uuid: String })

  const mindstorm = JSON.parse(JSON.stringify(await Agent.state(props.uuid)))
  const world = reactive(await Agent.state(`run-state/${props.uuid}`))
  const svg = ref(null)

  const { registerAnimationCallback }  = useAnimationLoop()

  function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    )
  }

  registerAnimationCallback(() => {
    Object
      .entries(world)
      .forEach(([name1, { dimensions: d1, handlers }]) => {
        Object
          .entries(world)
          .forEach(([name2, other]) => {
            if (name1 === name2) return

            const { dimensions: d2 } = other
            if (handlers?.collision && checkCollision(d1, d2)) {
              const handler = handlers.collision
              try {
                const event = { other }
                const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
                const result = scopedHandler.bind(world[name])(world, event)
              }
              catch (error) {
                console.error('Error:', error.message)
              }
            }
          })
      })
  })

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