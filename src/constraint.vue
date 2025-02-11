<script setup>
  import { computed } from 'vue'
  import { worldToObjectPoint, objectToWorldPoint, resolveReference } from './helpers.js'

  const { world, name } = defineProps({
  	world: Object,
  	name: String,
    active: Boolean
  })

  const constraint = world.constraints[name]

  const worldPositions = computed(() => {
    const { from, to } = constraint
    return {
      name,
      from: objectToWorldPoint(from, resolveReference(from.reference, world)),
      to: objectToWorldPoint(to, resolveReference(to.reference, world))
    }
  })

  function handleDrag({ detail: { svg_x, svg_y } }, endpoint) {
    const { x, y } = worldToObjectPoint(
      { x:svg_x, y:svg_y },
      resolveReference(endpoint.reference, world)
    )
    endpoint.x = x
    endpoint.y = y
  }

</script>

<template>
  <g
    :class="{ active }"
  >
    <line
      :x1="worldPositions.from.x"
      :y1="worldPositions.from.y"
      :x2="worldPositions.to.x"
      :y2="worldPositions.to.y"
    />
    <circle
      :cx="worldPositions.from.x"
      :cy="worldPositions.from.y"
      :r="1"
      stroke="rgba(0,0,0,0.5)"
      stroke-width="0.5"
      fill="rgba(0,0,0,0)"
      v-drag
      @drag="event => handleDrag(event, world.constraints[name].from)"
    />
    <circle
      :cx="worldPositions.to.x"
      :cy="worldPositions.to.y"
      :r="1"
      stroke="rgba(0,0,0,0.5)"
      stroke-width="0.5"
      fill="rgba(0,0,0,0)"
      v-drag
      @drag="event => handleDrag(event, world.constraints[name].to)"
    />
  </g>
</template>

<style>

  line {
    stroke-width: 0.5;
    stroke: rgba(0,0,0,0.5);
  }

  .active line {
    stroke: rgba(0,0,0,1);
  }

</style>
