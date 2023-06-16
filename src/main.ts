import { createApp } from 'vue'

import App from './App.vue'
import route from './route'


import ElementPlus from 'element-plus'
import 'normalize.css'
import 'element-plus/dist/index.css'
import './index.css'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import SocketIO from './common/io'


const app = createApp(App)

app.use(ElementPlus).use(route).use(SocketIO,{
  // connection: 'ws://2d08147a.vip.cpolar.cn',
  connection: 'ws://127.0.0.1:3007',
}).mount('#app')

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}



