<script setup>
  import { ref } from 'vue'

  const props = defineProps({
    uuid: String,
    svg: Boolean,
    selected: Boolean,
    dimensions: {
      type: Object,
      required: false
    }
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
        v-bind="dimensions"
      />
      <rect
        v-if="selected"
        v-bind="dimensions"
        fill="rgba(0,0,0,0)"
        stroke-width="0.5"
        stroke="black"
        stroke-dasharray="1,1"
      />
    </g>
  </template>
  <img
    v-else
    :src="url"
  />
</template>