<script setup>
  import { ref, watch, onMounted, onUnmounted } from 'vue'
  import { compare, applyPatch } from 'fast-json-patch'
  import * as yaml from 'yaml'

  const props = defineProps({ object: Object })
  const textareaRef = ref(null)

  watch(() => props.object, () => {
    yamlString.value = yaml.stringify(props.object, { indent: 4 })
  }, {deep:true})

  const yamlString = ref(yaml.stringify(props.object, { indent: 4 }))

  function updateObject() {
    try {
      const edited = yaml.parse(yamlString.value, { strict: true })
      applyPatch(props.object, compare(props.object, edited))
    }
    catch (error) {
      console.log('ERROR PARSING WORLD EDIT')
    }
  }

  const handleKeydown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      updateObject()
    }
  }

  onMounted(() => {
    textareaRef.value?.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    textareaRef.value?.removeEventListener('keydown', handleKeydown)
  })
</script>

<template>
  <textarea
    id="world-editor"
    ref="textareaRef"
    v-focus
    v-model="yamlString"
    @keypress.enter.shift.prevent="updateObject"
    @keydown.backspace.stop
    @keydown.delete.stop
    @blur="updateObject"
  />
</template>