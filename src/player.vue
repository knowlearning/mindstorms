<script setup>
  import World from './world.vue'

  const props = defineProps({ uuid: String })
</script>

<template>
  <div id="mindstorm-player">
    <World :uuid="uuid" />
  </div>
</template>

<style>
  #mindstorm-player {
    width: 100%;
    height: 100%;
    background: black;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #mindstorm-player svg {
    width: 99%;
    height: 99%;
    display: block;
    overflow: visible;
  }
</style>