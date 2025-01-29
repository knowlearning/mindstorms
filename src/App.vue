<script setup>
  import { ref } from 'vue'

  const width = ref(window.visualViewport.width)
  const height = ref(window.visualViewport.height)

  window.visualViewport.addEventListener('resize', () => {
      width.value = window.visualViewport.width
      height.value = window.visualViewport.height
  })

</script>

<template>
  <div
    id="app-wrapper"
    :style="`
      width: ${width}px;
      height: ${height}px;
      transition: width 0.05s ease-out, height 0.05s ease-out;
    `"
  >
    <div id="app-footer"></div>
  </div>
</template>

<style scoped>
#app-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

#app-footer {
  position: absolute;
  width: 100%;
  bottom: 0;
  border-bottom: 1px solid red;
  border-top: 1px solid lime;
}
</style>
