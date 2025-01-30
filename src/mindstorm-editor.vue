<script setup>
  import { ref, reactive } from 'vue'
  import { useKeyboardEvents } from './keyboard.js'
  import Button from './button.vue'
  import Image from './image.vue'

  const props = defineProps({
    uuid: String
  })

  const { registerKey } = useKeyboardEvents()

  registerKey('Delete', removeSelected)
  registerKey('Backspace', removeSelected)

  const selected = ref(null)
  const mindstorm = reactive(await Agent.state(props.uuid))

  async function uploadImage() {
    const uuid = await Agent.upload({ browser: true })
    selected.value = uuid
    mindstorm[uuid] = {
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
      }
    }
  }

  function handleDrag({ detail: { svg_dx, svg_dy } }) {
    const uuid = selected.value
    if (uuid && mindstorm[uuid]) {
      mindstorm[uuid].dimensions.x += svg_dx
      mindstorm[uuid].dimensions.y += svg_dy
      mindstorm[uuid].origin.x += svg_dx
      mindstorm[uuid].origin.y += svg_dy
    }
  }

  function handleResize({ detail: { svg_dx, svg_dy } }) {
    const uuid = selected.value
    if (uuid && mindstorm[uuid]) {
      const { dimensions: d, origin: o, angle: a } = mindstorm[uuid]

      const prevWidth = d.width
      const prevHeight = d.height


      const angle = a/180*Math.PI

      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)

      const local_dx = svg_dx * cosAngle + svg_dy * sinAngle
      const local_dy = -svg_dx * sinAngle + svg_dy * cosAngle

      d.width = Math.max(5, d.width + local_dx*2)
      d.height = Math.max(5, d.height + local_dy*2)

      const scaleX = d.width/prevWidth
      const scaleY = d.height/prevHeight

      d.x += (prevWidth - d.width)/2
      d.y += (prevHeight - d.height)/2
      o.x = d.x + d.width/2
      o.y = d.y + d.height/2
    }
  }

  function handleRotate({ detail: { svg_dx, svg_dy, svg_x, svg_y } }) {
    const uuid = selected.value
    if (uuid && mindstorm[uuid]) {
      const { x: ox, y: oy } = mindstorm[uuid].origin
      const prev_svg_x = svg_x - svg_dx
      const prev_svg_y = svg_y - svg_dy

      const a1 = Math.atan2(svg_y - oy, svg_x - ox)
      const a2 = Math.atan2(prev_svg_y - oy, prev_svg_x - ox)

      mindstorm[uuid].angle += (a1-a2)*180/Math.PI
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
    @click="selected = null"
  >
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
          v-for="{ dimensions, angle, origin }, uuid in mindstorm"
          :key="uuid"
          @click.stop="selected = uuid"
          svg
          :selected="selected === uuid"
          :uuid="uuid"
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
            @click.stop
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
            @click.stop
            @drag="handleResize"
          />
          <circle
            :cx="mindstorm[selected].dimensions.x"
            :cy="mindstorm[selected].dimensions.y + mindstorm[selected].dimensions.height"
            :r="4"
            v-drag
            class="rotater-circle"
            @click.stop
            @drag="handleRotate"
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
    <div id="right-sidebar">
      <div
        v-for="item, uuid in mindstorm"
        :key="uuid"
        :class="{
          'sidebar-mindstorm-item': true,
          selected: selected === uuid
        }"
        :selected="selected === uuid"
        @click.stop="selected = uuid"
      >
        {{ item.name || 'unnamed item' }}
      </div>
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

  #right-sidebar {
    white-space: nowrap;
  }

  .sidebar-mindstorm-item {
    padding: 8px 16px;
  }

  .sidebar-mindstorm-item.selected {
    background: #EEEEEE;
  }

  .resizer-circle,
  .rotater-circle {
    fill: rgba(0,0,0,0.05);
  }

  .resizer-circle:hover,
  .rotater-circle:hover {
    fill: rgba(0,0,0,0.2);
  }
</style>