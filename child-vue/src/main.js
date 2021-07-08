import Vue from 'vue'
import App from './App.vue'
import router from './router'
import singleSpaVue from 'single-spa-vue'

Vue.config.productionTip = false

const appOptions = {
  el: '#vue', // 挂载到父应用中的id为vue的标签中
  router,
  render: h => h(App)
}

const vueLifeCycle = singleSpaVue({
  Vue,
  appOptions
})
// 如果父应用引用我
if(window.singleSpaNavigate) {
  __webpack_public_path__ = 'http://localhost:8081/'
}

if(!window.singleSpaNavigate) {
  delete appOptions.el
  new Vue(appOptions).$mount('#app')
}
// 协议接入 子应用定好协议 父应用会调用这些方法
export const bootstrap = vueLifeCycle.bootstrap
export const mount = vueLifeCycle.mount
export const unmount = vueLifeCycle.unmount


// 我们需要父应用加载子应用： 将子应用打包成一个个的lib去给父应用使用

// bootstrap mount unmount
// single-spa / sing-spa-vue
