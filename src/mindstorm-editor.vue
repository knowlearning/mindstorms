<script setup>
  import { ref, reactive } from 'vue'
  import Button from './button.vue'
  import Image from './image.vue'

  const props = defineProps({
    uuid: String
  })

  const selected = ref(null)
  const mindstorm = reactive(await Agent.state(props.uuid))

  async function uploadImage() {
    const uuid = await Agent.upload({ browser: true })
    mindstorm[uuid] = {
      dimensions: {
        x: 10,
        y: 10,
        width: 80,
        height: 80
      }
    }
  }

  function handleDrag({ detail: { svg_dx, svg_dy } }) {
    const uuid = selected.value
    if (uuid && mindstorm[uuid]) {
      mindstorm[uuid].dimensions.x += svg_dx
      mindstorm[uuid].dimensions.y += svg_dy
    }
  }

</script>

<template>
  <div id="mindstorm-editor-wrapper">
    <div id="resource-sidebar">
      <div id="resource-sidebar-header">
        <Button
          icon="fa-solid fa-upload"
          @click="uploadImage"
        />
      </div>
      <div id="resource-sidebar-content">
      </div>
    </div>
    <div id="mindstorm-editor">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <Image
          v-for="{ dimensions }, uuid in mindstorm"
          @click="selected = uuid"
          svg
          :selected="selected === uuid"
          :uuid="uuid"
          :dimensions="dimensions"
        />
        <rect
          v-if="selected"
          v-bind="mindstorm[selected].dimensions"
          fill="rgba(0,0,0,0)"
          stroke-width="0.5"
          stroke="black"
          stroke-dasharray="1,1"
          v-drag
          @drag="handleDrag"
        />
        <rect
          x="0"
          y="0"
          style="pointer-events: none;"
          width="100"
          height="100"
          fill="none"
          stroke-width="0.5"
          stroke="black"
          rx="2"
        />
      </svg>
    </div>
  </div>
</template>

<style>
  #mindstorm-editor-wrapper {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  #mindstorm-editor {
    width: 100%;
    height: 100%;
    flex-grow: 1;
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

  #resource-sidebar {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 128px;
  }

  #resource-sidebar-content
  {
    flex-grow: 1;
    overflow: scroll;
  }
</style>