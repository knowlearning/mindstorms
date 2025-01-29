<script setup>

  const props = defineProps({
  	uuid: String
  })

  const url = await Agent.download(props.uuid).url()

</script>

<template>
  <img :src="url" />
</template>