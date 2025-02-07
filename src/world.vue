<script setup>
  import Item from './item.vue'

  defineProps({ world: Object, clip: Boolean })

  const emit = defineEmits(['click', 'drag', 'dragstart', 'dragend', 'hover', 'hoverstart', 'hoverend', 'resize'])

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
      :clip-path="clip ? 'url(#myClip)' : ''"
    >
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
      <Item
        v-for="item, name in world.parts"
        :key="name"
        :item="item"
        v-drag
        @drag="event => emit('drag', { target: name, event })"
        @dragstart="event => emit('dragstart', { target: name, event })"
        @dragend="event => emit('dragend', { target: name, event })"
        @click.stop="event => emit('click', { target: name, event })"
        @resize="event => emit('resize', { target: name, event })"
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
      <slot name="overlay"></slot>
    </g>
  </svg>
</template>