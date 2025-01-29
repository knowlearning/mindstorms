import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Agent from '@knowlearning/agents'

window.Agent = Agent

document.addEventListener('gesturestart', function (event) {
  event.preventDefault()
})

createApp(App).mount('#app')
