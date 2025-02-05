<script setup>
  import Image from './image.vue'

  defineProps({ item: Object })
  const emit = defineEmits(['resize'])
</script>

<template>
  <g
    :transform="`
      translate(${item.x}, ${item.y})
      rotate(${item.angle}, 0, 0)
    `"
  >
    <Image
      v-if="item.sprite?.sheet"
      svg
      :uuid="item.sprite.sheet"
      :x="-item.width/2"
      :y="-item.height/2"
      :width="item.width"
      :height="item.height"
      @resize="emit('resize', $event)"
    />
    <foreignObject
      v-if="item.html"
      :x="-item.width/2"
      :y="-item.height/2"
      :width="item.width"
      :height="item.height"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        v-html="item.html"
        style="user-select: none"
      />
    </foreignObject>
    <Item
      v-for="item, name in item.parts"
      :key="name"
      :item="item"
    />
  </g>
</template>