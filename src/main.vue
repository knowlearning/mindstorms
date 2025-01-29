<script setup>
  import { ref, reactive, computed } from 'vue'
  import Button from './button.vue'
  import MindstormEditor from './mindstorm-editor.vue'

  const mindstorms = reactive(await Agent.state('mindstorms'))
  const sidebarWidth = ref(300)
  const editingName = ref(false)

  const orderedMindstorms = computed(() => {
    return (
      Object
        .entries(mindstorms)
        .sort((
          [_1, { displayIndex: a }],
          [_2, { displayIndex: b }]
        ) => a - b)
    )
  })

  const activeMindstorm = computed(() => {
    const active = Object.entries(mindstorms).find(([id, {active}]) => active)
    return active ? active[0] : null
  })

  function deactivateActive() {
    const uuid = activeMindstorm.value
    if (uuid) mindstorms[uuid].active = false
  }

  async function createNewMindstorm() {
    const uuid = Agent.uuid()
    deactivateActive()

    Object
      .values(mindstorms)
      .forEach(v => v.displayIndex += 1)

    mindstorms[uuid] = {
      displayIndex: 0,
      notes: 'hmmmmm ' + Date.now(),
      active: true
    }
  }

  async function selectMindstorm(uuid) {
    Object
      .values(mindstorms)
      .forEach(v => {
        if (v.active) v.active = false
      })

    mindstorms[uuid].active = true
  }
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
        <Button
          icon="fa-solid fa-pencil"
          @click="createNewMindstorm"
        />
      </div>
      <div id="sidebar-content">
        <div
          v-for="[uuid, {notes, active}] in orderedMindstorms"
          :key="uuid"
          :class="{
            'sidebar-mindstorm': true,
            active
          }"
          @click="selectMindstorm(uuid)"
        >
          <div class="sidebar-mindstorm-inner">
            <div class="sidebar-mindstorm-name">
              <input
                v-if="editingName && active"
                type="text"
                @keypress.enter="editingName = false"
                @blur="editingName = false"
                v-model="mindstorms[uuid].notes"
              />
              <span v-else>
                {{ notes }}
              </span>
            </div>
            <div v-if="active">
              <Button
                icon="fa-solid fa-ellipsis"
                @click="editingName = !editingName"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="content">
      <MindstormEditor
        v-if="activeMindstorm"
        :key="activeMindstorm"
        :uuid="activeMindstorm"
      />
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
    overflow-y: scroll;
  }

  .sidebar-mindstorm.active {
    background: #888888;
  }

  .sidebar-mindstorm {
    padding: 0 1em;
    cursor: pointer;
  }

  .sidebar-mindstorm-inner {
    display: flex;
    align-items: center;
    height: 40px;
  }

  .sidebar-mindstorm-name {
    flex-grow: 1;
  }
</style>
