<script setup>

  defineProps({
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    angle: Number,
    state: String
  })

  const emit = defineEmits(['corner-drag'])

</script>

<template>
  <g
    :transform="`
      translate(${x}, ${y})
      rotate(${angle}, 0, 0)
    `"
    :class="state"
  >
    <rect
      :x="-width/2"
      :y="-height/2"
      :width="width"
      :height="height"
      v-drag
      style="pointer-events: none;"
    />
    <circle
      :cx="0"
      :cy="0"
      :r="1"
      style="pointer-events: none;"
    />
    <circle
      v-if="state === 'selected'"
      :cx="width/2"
      :cy="height/2"
      :r="4"
      v-drag
      class="resizer-circle"
      @mousedown.stop
      @drag="event => emit('corner-drag', event)"
    />
  </g>
</template>

<style scoped>

  rect {
    fill: none;
    stroke-width: 0.5;
    stroke-dasharray: 1,1;
  }

  .selected rect {
    stroke: black;
  }

  .hovered rect {
    stroke: rgba(0,0,0,0.3);
  }

  .passive rect {
    stroke: rgba(0,0,0,0.1);
  }

  .resizer-circle {
    fill: rgba(0,0,0,0.05);
  }

  .resizer-circle:hover {
    fill: rgba(0,0,0,0.2);
  }

</style>