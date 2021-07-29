import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { registerApplication, start} from 'single-spa'

Vue.config.productionTip = false

async function loadScript(url){
  return new Promise((resolve, reject) => {
    let script = document.createElement('script')
    script.src = url
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// singleSpa缺陷
// 不够灵活 不能动态加载js文件 样式不隔离 没有js沙箱机制

registerApplication(
  'vueApp', 
  async () => {
    // systemJS
    await loadScript(`http://localhost:8081/js/chunk-vendors.js`)
    await loadScript(`http://localhost:8081/js/app.js`)
    return window.singleVue
  },
  location => location.pathname.startsWith('/vue') // 用户切换到 /vue 的路径下，需要加载刚才定义的子应用
)
start()

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
