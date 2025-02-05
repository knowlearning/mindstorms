<script setup>
  import { ref } from 'vue'

  const props = defineProps({
    uuid: String,
    svg: Boolean,
    selected: Boolean,
    x: Number,
    y: Number,
    width: Number,
    height: Number
  })

  const emit = defineEmits(['resize'])

  const url = ref(null)
  Agent
    .download(props.uuid)
    .url()
    .then(u => {
      const img = new Image()
      img.src = u
      img.onload = () => {
        emit('resize', {
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
      url.value = u
    })


</script>

<template>
  <template v-if="svg">
    <image
      :key="url"
      :href="url"
      :x="x"
      :y="y"
      :width="width"
      :height="height"
    />
  </template>
  <img
    v-else
    :src="url"
  />
</template>