import { createApp } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import App from './App.vue'
import './style.css'
import './fontawesome.js'

createApp(App).component('font-awesome-icon', FontAwesomeIcon).mount('#app')
