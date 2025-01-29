<script setup>
  const props = defineProps({
  	uuid: String
  })

  const mindstorm = await Agent.state(props.uuid)
</script>

<template>
  {{ uuid }}
  {{ mindstorm }}
</template>