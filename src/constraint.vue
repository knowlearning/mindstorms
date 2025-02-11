<script setup>
  import { computed } from 'vue'
  import { worldToObjectPoint, objectToWorldPoint, resolveReference } from './helpers.js'

  const { world, name, editable } = defineProps({
  	world: Object,
  	name: String,
    selected: Boolean,
    editable: Boolean
  })

  const constraint = world.connections[name]

  const worldPositions = computed(() => {
    const { from, to } = constraint
    return {
      name,
      from: objectToWorldPoint(from, resolveReference(from.reference, world)),
      to: objectToWorldPoint(to, resolveReference(to.reference, world))
    }
  })

  function handleDrag({ detail: { svg_x, svg_y } }, endpoint) {
    if (!editable) return

    const { x, y } = worldToObjectPoint(
      { x:svg_x, y:svg_y },
      resolveReference(endpoint.reference, world)
    )
    endpoint.x = x
    endpoint.y = y
  }

</script>

<template>
  <g :class="{ selected }">
    <line
      class="target"
      :x1="worldPositions.from.x"
      :y1="worldPositions.from.y"
      :x2="worldPositions.to.x"
      :y2="worldPositions.to.y"
      stroke-linecap="round"
    />
    <line
      class="drawn"
      :x1="worldPositions.from.x"
      :y1="worldPositions.from.y"
      :x2="worldPositions.to.x"
      :y2="worldPositions.to.y"
      stroke-linecap="round"
    />
    <circle
      :cx="worldPositions.from.x"
      :cy="worldPositions.from.y"
      :r="1"
      stroke="rgba(0,0,0,0.5)"
      stroke-width="0.5"
      fill="rgba(0,0,0,0)"
      v-drag
      @drag="event => handleDrag(event, world.connections[name].from)"
    />
    <circle
      :cx="worldPositions.to.x"
      :cy="worldPositions.to.y"
      :r="1"
      stroke="rgba(0,0,0,0.5)"
      stroke-width="0.5"
      fill="rgba(0,0,0,0)"
      v-drag
      @drag="event => handleDrag(event, world.connections[name].to)"
    />
  </g>
</template>

<style scoped>

  line {
    stroke-width: 0.5;
    stroke: rgba(0,0,0,0.5);
  }

  line.target {
    stroke-width: 2;
    stroke: rgba(0,0,0,0);
  }

  .selected line.drawn,
  .selected circle {
    stroke: rgba(0,0,0,1);
  }

  .selected line.target {
    stroke-width: 2;
    stroke: rgba(0,0,0,0.1);
  }

</style>
