import { createApp } from 'vue'
import App from './App.vue'

// 样式导入
import '@unocss/reset/tailwind.css'
import 'uno.css'

// 创建应用实例
const app = createApp(App)

// 挂载应用
app.mount('#app')