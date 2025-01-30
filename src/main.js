import { createApp } from 'vue'
import './style.css'
import App from './app.vue'
import Agent from '@knowlearning/agents'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPencil, faEllipsis, faUpload, faXmark, faGlobe } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import drag from './drag.js';

library
  .add(
    faPencil,
    faEllipsis,
    faUpload,
    faXmark,
    faGlobe
  )

window.Agent = Agent

document.addEventListener('gesturestart', function (event) {
  event.preventDefault()
})

createApp(App)
  .directive('focus', {
    mounted(el, binding) {
      setTimeout(() => el.focus(), 50)
    }
  })
  .directive('drag', drag)
  .mount('#app')
