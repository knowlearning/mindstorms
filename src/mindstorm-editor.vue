<script setup>
  import { reactive } from 'vue'
  import Button from './button.vue'
  import Image from './image.vue'

  const props = defineProps({
    uuid: String
  })

  const mindstorm = reactive(await Agent.state(props.uuid))

  if (!mindstorm.images) mindstorm.images = []

  async function uploadImage() {
    const uuid = await Agent.upload({ browser: true })
    mindstorm.images.push(uuid)
  }

</script>

<template>
  <div id="mindstorm-editor-wrapper">
    <div>
      <Button
        icon="fa-solid fa-upload"
        @click="uploadImage"
      />
      <div v-for="uuid in mindstorm.images">
        <Image :uuid="uuid" />
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
</style>