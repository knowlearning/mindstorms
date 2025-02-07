<script setup>
  import { ref, reactive, watch, computed } from 'vue'
  import { vueEmbedComponent } from '@knowlearning/agents/vue.js'
  import { useKeyboardEvents } from '../composables/keyboard.js'
  import World from '../world.vue'
  import Button from '../button.vue'
  import YAMLEditor from './yaml.vue'

  const props = defineProps({
    uuid: String
  })

  const MODES = {
    PLAY: 'play',
    CONSTRAINT: 'constraint'
  }

  const { registerKey } = useKeyboardEvents()

  registerKey('Delete', removeSelected)
  registerKey('Backspace', removeSelected)
  registerKey('Escape', () => mode.value = null)

  const selected = ref(null)
  const mindstorm = reactive(await Agent.state(props.uuid))
  const editingWorld = ref(false)
  const codeSidebarWidth = ref(window.innerWidth/3)
  const mode = ref(null)

  if (!mindstorm.parts) mindstorm.parts = {}
  if (!mindstorm.constraints) mindstorm.constraints = {}
  if (!mindstorm.x) mindstorm.x = 0
  if (!mindstorm.y) mindstorm.y = 0
  if (!mindstorm.angle) mindstorm.angle = 0
  if (!mindstorm.width) mindstorm.width = 100
  if (!mindstorm.height) mindstorm.height = 100

  const selectedPart = computed(() => {
    return selected.value && mindstorm.parts[selected.value] ? mindstorm.parts[selected.value] : null
  })

  function newPartName() {
    let index = 1
    let name = `item${index}`
    while (mindstorm.parts[name]) name = `item${index++}`
    return name
  }

  async function uploadImage() {
    const uuid = await Agent.upload({ browser: true })
    const name = newPartName()
    //  TODO: sprite should be a whole sprite object...
    selected.value = name
    mindstorm.parts[name] = {
      sprite: uuid,
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

  function handleDragstart({ event: { detail: { svg_x, svg_y } } }) {
    if (selectedPart.value) {
      if (mode.value === MODES.CONSTRAINT) {
        console.log('CONSTRAINT START', svg_x, svg_y)
      }
    }
  }

  function handleDragstop({ event: { detail } }) {
    if (selectedPart.value) {
      if (mode.value === MODES.CONSTRAINT) {
        console.log('CONSTRAINT STOP', detail)
      }
    }
  }

  function handleDrag({ event: { detail: { svg_dx, svg_dy, svg_x, svg_y } } }) {
    if (selectedPart.value) {
      if (mode.value === MODES.CONSTRAINT) {
        console.log('CONSTRAINT MODE!', svg_x, svg_y)
      }
      else {
        selectedPart.value.x += svg_dx
        selectedPart.value.y += svg_dy
      }
    }
  }

  function distance(x1, y1, x2, y2) {
    const a = x1-x2
    const b = y1-y2
    return Math.sqrt(a*a + b*b)
  }

  function handleResizeAndRotate({ detail: { svg_dx, svg_dy, svg_x, svg_y } }) {
    if (selectedPart.value) {
      const o = selectedPart.value
      const { x, y, angle: a, width, height } = o

      const prev_svg_x = svg_x - svg_dx
      const prev_svg_y = svg_y - svg_dy

      const a1 = Math.atan2(svg_y - y, svg_x - x)
      const a2 = Math.atan2(prev_svg_y - y, prev_svg_x - x)

      o.angle += (a1-a2)*180/Math.PI
      const aRad = o.angle/180*Math.PI

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
    delete mindstorm.parts[selected.value]
    selected.value = null
  }

  function handleResize({ target, event }) {
    const o = mindstorm.parts[target]

    const eventRatio = event.width/event.height
    const targetRatio = o.width/o.height

    const ratio = targetRatio/eventRatio
    if (1 > ratio) o.height *= ratio
    else if (1 < ratio) o.width /= ratio
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
          @click="mode = MODES.PLAY"
          :pressed="mode === MODES.PLAY"
        />
        <Button
          icon="fa-solid fa-upload"
          @click="uploadImage"
        />
        <Button
          icon="fa-solid fa-anchor"
          @click="mode = MODES.CONSTRAINT === mode ? null : MODES.CONSTRAINT"
          :pressed="mode === MODES.CONSTRAINT"
        />
      </div>
      <div id="resource-sidebar-content">
      </div>
    </div>
    <div id="mindstorm-editor">
      <World
        :world="mindstorm"
        @click="handleClick"
        @mousedown.stop
        @resize="handleResize"
        @dragstart="handleDragstart"
        @drag="handleDrag"
        @dragend="handleDragstop"
      >
        <template v-slot:overlay>
          <g
            v-if="selected"
            :transform="`
              translate(
                ${selectedPart.x},
                ${selectedPart.y}
              )
              rotate(${selectedPart.angle}, 0, 0)
            `"
          >
            <rect
              :x="-selectedPart.width/2"
              :y="-selectedPart.height/2"
              :width="selectedPart.width"
              :height="selectedPart.height"
              fill="rgba(0,0,0,0)"
              stroke-width="0.5"
              stroke="black"
              stroke-dasharray="1,1"
              v-drag
              style="pointer-events: none;"
            />
            <circle
              :cx="0"
              :cy="0"
              :r="1"
            />
            <circle
              :cx="selectedPart.width/2"
              :cy="selectedPart.height/2"
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
          v-for="item, name in mindstorm.parts"
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
        :object="selected ? selectedPart : mindstorm"
      />
    </div>
  </div>
  <div
    id="mindstorm-player-wrapper"
    class="fade-in"
    v-if="mode === MODES.PLAY"
  >
    <div id="mindstorm-player-controls">
      <Button
        icon="fa-solid fa-xmark"
        @click="mode = null"
      />
    </div>
    <vueEmbedComponent
      :id="uuid"
      @close="mode = null"
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