import { createApp } from 'vue'
import './style.css'
import App from './app.vue'
import Main from './main.vue'
import Player from './player.vue'
import Agent from '@knowlearning/agents'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPencil, faEllipsis, faUpload, faXmark, faGlobe, faPlay } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import drag from './drag.js'

window.Agent = Agent

const uuid = window.location.pathname.slice(1)

document.addEventListener('gesturestart', function (event) {
  event.preventDefault()
})


if (uuid) {
  createApp(App, { component: Player, props: { uuid } })
    .directive('focus', {
      mounted(el, binding) {
        setTimeout(() => el.focus(), 50)
      }
    })
    .directive('drag', drag)
    .mount('#app')
}
else {
  library
    .add(
      faPencil,
      faEllipsis,
      faUpload,
      faXmark,
      faGlobe,
      faPlay
    )

  createApp(App, { component: Main, props: {} })
    .directive('focus', {
      mounted(el, binding) {
        setTimeout(() => el.focus(), 50)
      }
    })
    .directive('drag', drag)
    .mount('#app')
}
