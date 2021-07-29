

import { reroute } from "../navigations/reroute"
import { MOUNTED, BOOTSTRAPPING, NOT_BOOTSTRAPPED, NOT_MOUNTED, NOT_LOADED, LOADING_SOURCE_CODE, shouldBeActive } from "./app.helpers"

const apps  = [] // 用来存放所有的应用

/**
 * @name: 
 * @test: test font
 * @msg: 
 * @param {*} appName 应用名
 * @param {*} loadApp 加载的应用
 * @param {*} activeWhen 当激活时会调用loadApp
 * @param {*} customProps 自定义属性
 * @return {*}
 */

// 维护所有状态 状态机
export function registerApplication(appName, loadApp, activeWhen, customProps) {
  apps.push({ // 将应用注册好
    appName,
    loadApp,
    activeWhen,
    customProps,
    state: NOT_LOADED
  })
  reroute() // 加载应用
}

export function getAppChanges() {
  const appsToUnmount = [] // 要卸载的应用
  const appsToLoad = [] // 要加载的应用
  const appsToMount = [] // 要挂载的应用

  apps.forEach(app => {
    const appShouldBeActive = shouldBeActive(app)
    switch(app.state) {
      case NOT_LOADED:
      case LOADING_SOURCE_CODE:
        if(appShouldBeActive) {
          appsToLoad.push(app)
        }
        break
      case NOT_BOOTSTRAPPED:
      case BOOTSTRAPPING:
      case NOT_MOUNTED:
        if(appShouldBeActive){
          appsToMount.push(app)
        }
        break
      case MOUNTED:
        if(!appShouldBeActive) {
          appsToUnmount.push(app)
        }
        break
    }
  })
  return {appsToUnmount, appsToLoad, appsToMount}
}