<script setup>
  import { ref } from 'vue'

  const sidebarWidth = ref(300)
</script>

<template>
  <div id="main">
    <div
      id="sidebar"
      :style="`
        width: ${sidebarWidth}px;
      `"
    >
      <div id="sidebar-header">
      </div>
      <div id="sidebar-content">
      </div>
    </div>
    <div id="content">
    </div>
  </div>
</template>

<style scoped>
  #main {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: stretch;
  }

  #sidebar {
    background: #EEEEEE;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  #content,
  #sidebar-content {
    flex-grow: 1;
  }
</style>
