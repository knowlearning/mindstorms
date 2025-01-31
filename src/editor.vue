<script setup>
  import { ref, reactive, watch } from 'vue'
  import { vueEmbedComponent } from '@knowlearning/agents/vue.js'
  import { compare, applyPatch } from 'fast-json-patch'
  import * as yaml from 'yaml'
  import { useKeyboardEvents } from './keyboard.js'
  import Button from './button.vue'
  import Image from './image.vue'

  const props = defineProps({
    uuid: String
  })

  const { registerKey } = useKeyboardEvents()

  registerKey('Delete', removeSelected)
  registerKey('Backspace', removeSelected)
  registerKey('Escape', () => playMode.value = false)

  const selected = ref(null)
  const mindstorm = reactive(await Agent.state(props.uuid))
  const editingWorld = ref(false)
  const codeSidebarWidth = ref(window.innerWidth/3)
  const worldEdit = ref(yaml.stringify(mindstorm, { indent: 4 }))
  const playMode = ref(false)

  watch(() => mindstorm, () => {
    worldEdit.value = yaml.stringify(mindstorm, { indent: 4 })
  }, { deep: true })

  function updateMindstorm() {
    try {
      const edited = yaml.parse(worldEdit.value, { strict: true })
      applyPatch(mindstorm, compare(mindstorm, edited))
    }
    catch (error) {
      console.log('ERROR PARSING WORLD EDIT')
    }
  }

  function newItemName() {
    let index = 1
    let name = `item${index}`
    while (mindstorm[name]) name = `item${index++}`
    return name
  }

  async function uploadImage() {
    const uuid = await Agent.upload({ browser: true })
    const name = newItemName()
    selected.value = name
    mindstorm[name] = {
      sprite: uuid,
      dimensions: {
        x: 10,
        y: 10,
        width: 80,
        height: 80
      },
      angle: 0,
      origin: {
        x: 50,
        y: 50
      },
      handlers: {
        click: "alert('Ouch!')"
      }
    }
  }

  function handleDrag({ detail: { svg_dx, svg_dy } }) {
    const name = selected.value
    if (name && mindstorm[name]) {
      const { dimensions, origin } = mindstorm[name]
      dimensions.x += svg_dx
      dimensions.y += svg_dy
      origin.x += svg_dx
      origin.y += svg_dy
    }
  }

  function distance(x1, y1, x2, y2) {
    const a = x1-x2
    const b = y1-y2
    return Math.sqrt(a*a + b*b)
  }

  function handleResizeAndRotate({ detail: { svg_dx, svg_dy, svg_x, svg_y } }) {
    const name = selected.value
    if (name && mindstorm[name]) {
      const { dimensions: d, origin: o, angle: a } = mindstorm[name]

      const prev_svg_x = svg_x - svg_dx
      const prev_svg_y = svg_y - svg_dy
      const prevWidth = d.width
      const prevHeight = d.height

      const scale = distance(svg_x+svg_dx, svg_y+svg_dy, o.x, o.y)/distance(svg_x, svg_y, o.x, o.y)

      d.width = Math.max(5, d.width * scale)
      d.height = Math.max(5, d.height * scale)

      d.x += (prevWidth - d.width)/2
      d.y += (prevHeight - d.height)/2
      o.x = d.x + d.width/2
      o.y = d.y + d.height/2

      const a1 = Math.atan2(svg_y - o.y, svg_x - o.x)
      const a2 = Math.atan2(prev_svg_y - o.y, prev_svg_x - o.x)

      mindstorm[name].angle += (a1-a2)*180/Math.PI
    }
  }

  function removeSelected() {
    delete mindstorm[selected.value]
    selected.value = null
  }

  function calculateAngleAdjustment(x, y, centerX, centerY) {
    const deltaX = x - centerX
    const deltaY = y - centerY
    return Math.atan2(deltaY, deltaX)
  }

</script>

<template>
  <div
    id="mindstorm-editor-wrapper"
    @mousedown="selected = null"
  >
    <div id="resource-sidebar">
      <div id="resource-sidebar-header">
        <Button
          icon="fa-solid fa-play"
          @click="playMode = true"
        />
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
          v-for="{ dimensions, angle, origin, sprite }, name in mindstorm"
          :key="sprite"
          @mousedown.stop="selected = name"
          svg
          :selected="selected === name"
          :uuid="sprite"
          :dimensions="dimensions"
          :transform="`rotate(${angle}, ${origin.x}, ${origin.y})`"
        />
        <g
          v-if="selected"
          :transform="`rotate(${mindstorm[selected].angle}, ${mindstorm[selected].origin.x}, ${mindstorm[selected].origin.y})`"
        >
          <rect
            v-bind="mindstorm[selected].dimensions"
            fill="rgba(0,0,0,0)"
            stroke-width="0.5"
            stroke="black"
            stroke-dasharray="1,1"
            v-drag
            @mousedown.stop
            @drag="handleDrag"
          />
          <circle
            :cx="mindstorm[selected].origin.x"
            :cy="mindstorm[selected].origin.y"
            :r="1"
          />
          <circle
            :cx="mindstorm[selected].dimensions.x + mindstorm[selected].dimensions.width"
            :cy="mindstorm[selected].dimensions.y + mindstorm[selected].dimensions.height"
            :r="4"
            v-drag
            class="resizer-circle"
            @mousedown.stop
            @drag="handleResizeAndRotate"
          />
        </g>
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
    <div id="world-sidebar">
      <div id="world-sidebar-header">
        <Button
          icon="fa-solid fa-globe"
          @click="() => {
            editingWorld = !editingWorld
          }"
        />
      </div>
      <div id="world-sidebar-content">
        <div
          v-for="item, name in mindstorm"
          :key="name"
          :class="{
            'sidebar-mindstorm-item': true,
            selected: selected === name
          }"
          :selected="selected === name"
          @click.stop="selected = name"
        >
          {{ name }}
        </div>
      </div>
    </div>
    <div
      id="code-sidebar"
      v-if="editingWorld"
      :style="`
        flex: none;
        width: ${codeSidebarWidth}px;
      `"
    >
      <textarea
        id="world-editor"
        v-focus
        v-model="worldEdit"
        @keypress.enter="updateMindstorm"
      />
    </div>
  </div>
  <div
    id="mindstorm-player-wrapper"
    class="fade-in"
    v-if="playMode"
  >
    <div id="mindstorm-player-controls">
      <Button
        icon="fa-solid fa-xmark"
        @click="playMode = false"
      />
    </div>
    <vueEmbedComponent
      :id="uuid"
      @close="playMode = false"
      style="background: black;"
    />
  </div>
</template>

<style>
  #mindstorm-editor-wrapper {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  #mindstorm-player-wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    top: 0;
    left: 0;
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

  #resource-sidebar,
  #world-sidebar {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 128px;
  }

  #resource-sidebar-content,
  #world-sidebar-content {
    flex-grow: 1;
    overflow: scroll;
  }

  #right-sidebar {
    white-space: nowrap;
  }

  .sidebar-mindstorm-item {
    padding: 8px 16px;
  }

  .sidebar-mindstorm-item.selected {
    background: #EEEEEE;
  }

  .resizer-circle {
    fill: rgba(0,0,0,0.05);
  }

  .resizer-circle:hover {
    fill: rgba(0,0,0,0.2);
  }

  #code-sidebar {
    position: relative;
  }

  #world-editor {
    display: block;
    width: calc(100% - 8px);
    height: calc(100% - 8px);
    border: none;
    padding: 4px;
    resize: none;
    background: #EEEEEE;
  }

  #mindstorm-player-controls {
    position: absolute;
  }

  .fade-in {
      opacity: 0;
      animation: fadeIn 0.2s ease-in forwards;
  }

  @keyframes fadeIn {
      from {
          opacity: 0;
      }
      to {
          opacity: 1;
      }
  }

</style>