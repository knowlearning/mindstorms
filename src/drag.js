export default {
  mounted(el, binding) {
    let startX = 0
    let startY = 0
    let lastX = 0
    let lastY
    let isDragging = false

    const handleStart = (event) => {
      if (event.type === 'mousedown' || event.touches) {
        isDragging = true
        const clientX = event.touches ? event.touches[0].clientX : event.clientX
        const clientY = event.touches ? event.touches[0].clientY : event.clientY

        startX = clientX
        startY = clientY
        lastX = clientX
        lastY = clientY

        document.addEventListener('mousemove', handleMove)
        document.addEventListener('touchmove', handleMove)
        document.addEventListener('mouseup', handleEnd)
        document.addEventListener('touchend', handleEnd)
      }
    }

    const handleMove = (event) => {
      if (isDragging) {
        const clientX = event.touches ? event.touches[0].clientX : event.clientX
        const clientY = event.touches ? event.touches[0].clientY : event.clientY

        const tx = clientX - startX
        const ty = clientY - startY

        const dx = clientX - lastX
        const dy = clientY - lastY

        lastX = clientX
        lastY = clientY

        const detail = { dx, dy, tx, ty }

        const svgElement = el.closest('svg')
        if (svgElement) {
          const ctm = svgElement.getScreenCTM()

          const sx = ctm ? 1 / ctm.a : 1
          const sy = ctm ? 1 / ctm.d : 1

          detail.svg_dx = dx * sx
          detail.svg_dy = dy * sy

          if (ctm) {
            const point = svgElement.createSVGPoint()
            point.x = clientX
            point.y = clientY
            const svgPoint = point.matrixTransform(ctm.inverse())
            detail.svg_x = svgPoint.x
            detail.svg_y = svgPoint.y
          }
        }

        el.dispatchEvent(new CustomEvent('drag', { detail }))
      }
    }

    const handleEnd = () => {
      isDragging = false
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchend', handleEnd)
    }

    el.handleStart = handleStart
    el.addEventListener('mousedown', handleStart)
    el.addEventListener('touchstart', handleStart)
  },

  unmounted(el) {
    el.removeEventListener('mousedown', el.handleStart)
    el.removeEventListener('touchstart', el.handleStart)
  }
}