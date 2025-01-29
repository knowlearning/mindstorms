<script setup>
  import { ref, reactive } from 'vue'
  import Main from './main.vue'

  const width = ref(window.visualViewport.width)
  const height = ref(window.visualViewport.height)

  const body = document.body
  const html = body.parentElement

  function debounce(func, wait) {
    let timeout
    return function(...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  const debouncedScrollIntoPlace = debounce(() => {
    body.scrollIntoView({ behavior: 'smooth' })
  }, 100)

  window.visualViewport.addEventListener('scroll', () => {
    debouncedScrollIntoPlace()

  })

  window.visualViewport.addEventListener('resize', () => {
    const { width: w, height: h, scale: s } = window.visualViewport
    body.style.width = `${w*s}px`
    html.style.height = `${h*s}px`
    width.value = w*s
    height.value = h*s
  })

</script>

<template>
  <div
    id="app-wrapper"
    :style="`
      width: ${width}px;
      height: ${height}px;
      transition: width 0.05s ease-out, height 0.05s ease-out;
    `"
  >
    <Suspense>
      <Main />
    </Suspense>
  </div>
</template>

<style scoped>
#app-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  background: white;
}

#app-footer {
  position: absolute;
  width: 100%;
  bottom: 0;
}
</style>
