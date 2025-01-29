<script setup>
  const props = defineProps({
    uuid: String
  })

  const mindstorm = await Agent.state(props.uuid)
</script>

<template>
  <div id="mindstorm-editor">
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill="none"
        stroke-width="1"
        stroke="black"
        rx="2"
      />
    </svg>
  </div>
</template>

<style>
  #mindstorm-editor {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #mindstorm-editor svg {
    width: 90%;
    height: 90%;
    display: block;
    overflow: visible;
  }
</style>