<script setup>
  import { reactive } from 'vue'
  import Button from './button.vue'
  import Image from './image.vue'

  const props = defineProps({
    uuid: String
  })

  const mindstorm = reactive(await Agent.state(props.uuid))

  if (!mindstorm.resources) mindstorm.resources = []

  async function uploadImage() {
    const uuid = await Agent.upload({ browser: true })
    mindstorm.resources.push(uuid)
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
        <div v-for="uuid in mindstorm.resources">
          <Image
            :uuid="uuid"
            style="width: 100%"
          />
        </div>
      </div>
    </div>
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