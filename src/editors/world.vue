<script setup>
  import { ref, reactive, watch } from 'vue'
  import { vueEmbedComponent } from '@knowlearning/agents/vue.js'
  import { useKeyboardEvents } from '../keyboard.js'
  import World from '../world.vue'
  import Button from '../button.vue'
  import YAMLEditor from './yaml.vue'

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
  const playMode = ref(false)

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
      sprite: {
        sheet: uuid
      },
      x: 10,
      y: 10,
      width: 80,
      height: 80,
      angle: 0
    }
  }

  function handleClick({ target, event }) {
    selected.value = target
  }

  function handleDrag({ detail: { svg_dx, svg_dy } }) {
    const name = selected.value
    if (name && mindstorm[name]) {
      mindstorm[name].x += svg_dx
      mindstorm[name].y += svg_dy
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
      const o = mindstorm[name]
      const { x, y, angle: a, width, height } = o

      const prev_svg_x = svg_x - svg_dx
      const prev_svg_y = svg_y - svg_dy

      const a1 = Math.atan2(svg_y - y, svg_x - x)
      const a2 = Math.atan2(prev_svg_y - y, prev_svg_x - x)

      mindstorm[name].angle += (a1-a2)*180/Math.PI
      const aRad = mindstorm[name].angle/180*Math.PI

      const theta = Math.atan2(svg_dy, svg_dx)
      const dOnDiagonal = distance(0, 0, svg_dx, svg_dy) * Math.cos(theta - aRad + Math.atan2(-height, width))

      const scaleFactor = 1 + dOnDiagonal/(distance(0, 0, width, height)/2)

      o.width *= scaleFactor
      o.height *= scaleFactor

      scaleParts(o.parts || {}, scaleFactor)
    }
  }

  function scaleParts(parts, scale) {
    Object
      .values(parts || {})
      .forEach(part => {
        part.x *= scale
        part.y *= scale
        part.width *= scale
        part.height *= scale
        scaleParts(part.parts)
      })
  }

  function removeSelected() {
    delete mindstorm[selected.value]
    selected.value = null
  }

  function handleResize({ target, event }) {
    const eventRatio = event.width/event.height
    const targetRatio = mindstorm[target].width/mindstorm[target].height
    if (eventRatio > targetRatio) {
      mindstorm[target].height *= targetRatio/eventRatio
    }
    else if (eventRatio < targetRatio) {
      mindstorm[target].width *= eventRatio/targetRatio
    }
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
      <World
        :world="mindstorm"
        @click="handleClick"
        @resize="handleResize"
      >
        <template v-slot:overlay>
          <g
            v-if="selected"
            :transform="`
              translate(
                ${mindstorm[selected].x},
                ${mindstorm[selected].y}
              )
              rotate(${mindstorm[selected].angle}, 0, 0)
            `"
          >
            <rect
              :x="-mindstorm[selected].width/2"
              :y="-mindstorm[selected].height/2"
              :width="mindstorm[selected].width"
              :height="mindstorm[selected].height"
              fill="rgba(0,0,0,0)"
              stroke-width="0.5"
              stroke="black"
              stroke-dasharray="1,1"
              v-drag
              @mousedown.stop
              @drag="handleDrag"
            />
            <circle
              :cx="0"
              :cy="0"
              :r="1"
            />
            <circle
              :cx="mindstorm[selected].width/2"
              :cy="mindstorm[selected].height/2"
              :r="4"
              v-drag
              class="resizer-circle"
              @mousedown.stop
              @drag="handleResizeAndRotate"
            />
          </g>
        </template>
      </World>
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
          @mousedown.stop="selected = name"
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
      @click.stop
      @mousedown.stop
    >
      <YAMLEditor
        :key="selected"
        :object="selected ? mindstorm[selected] : mindstorm"
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