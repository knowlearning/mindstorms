import { createApp } from 'vue'
import './style.css'
import App from './app.vue'
import Agent from '@knowlearning/agents'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPencil, faEllipsis, faUpload, faXmark } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

library
  .add(
    faPencil,
    faEllipsis,
    faUpload,
    faXmark
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
  .mount('#app')
