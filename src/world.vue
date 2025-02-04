<script setup>
  import Image from './image.vue'

  defineProps({ world: Object, clip: Boolean })
  const emit = defineEmits(['click', 'drag'])

</script>

<template>
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <clipPath id="myClip">
        <rect x="0" y="0" width="100" height="100" rx="2" />
      </clipPath>
    </defs>
    <g
      :clip-path="clip ? 'url(#myClip)' : ''">
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
      <g
        v-for="{ x, y, width, height, angle, origin, sprite, html }, name in world"
        :key="name"
        :transform="`
          translate(${x}, ${y})
          rotate(${angle}, 0, 0)
        `"        v-drag
        @drag="event => emit('drag', { target: name, event })"
        @click.stop="event => emit('click', { target: name, event })"
      >
        <Image
          v-if="sprite?.sheet"
          svg
          :uuid="sprite.sheet"
          :x="-width/2"
          :y="-height/2"
          :width="width"
          :height="height"
        />
        <foreignObject
          v-if="html"
          :x="-width/2"
          :y="-height/2"
          :width="width"
          :height="height"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            v-html="html"
            style="user-select: none"
          />
        </foreignObject>
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
      <slot name="overlay"></slot>
    </g>
  </svg>
</template>