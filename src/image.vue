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

  const url = ref(null)

  Agent
    .download(props.uuid)
    .url()
    .then(r => url.value = r)

</script>

<template>
  <template v-if="svg">
    <g>
      <image
        :key="url"
        :href="url"
        :x="x"
        :y="y"
        :width="width"
        :height="height"
      />
    </g>
  </template>
  <img
    v-else
    :src="url"
  />
</template>