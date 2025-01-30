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
    </g>
  </template>
  <img
    v-else
    :src="url"
  />
</template>