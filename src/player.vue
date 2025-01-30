<script setup>
  import World from './world.vue'

  const props = defineProps({ uuid: String })
  console.log('player props', props)
</script>

<template>
  <suspense>
    <div id="mindstorm-player">
      <World :uuid="uuid" />
    </div>
  </suspense>
</template>

<style>
  #mindstorm-player {
    width: 100%;
    height: 100%;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #mindstorm-player svg {
    width: 90%;
    height: 90%;
    display: block;
    overflow: visible;
  }
</style>