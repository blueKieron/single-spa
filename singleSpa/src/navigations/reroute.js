import { getAppChanges } from "../applications/app";
import { toBootstrapPromise } from "../lifecycles/bootstrap";
import { toLoadPromise } from "../lifecycles/load";
import { toMountPromise } from "../lifecycles/mount";
import { toUnMountPromise } from "../lifecycles/unmount";
import { started } from "../start";

import './navigator-events'

// 核心应用处理方
export function reroute() {

  // 需要获取要加载的应用
  // 需要获取要被挂载的应用
  // 哪些应用需要被卸载
  const {appsToLoad, appsToMount, appsToUnmount} = getAppChanges()
  if (started) {
    // app装载
    return performAppChanges() // 根据路径来装载应用
  } else {
    // 注册应用时，需要预先加载
    return loadApps() // 预加载应用
  }

  async function performAppChanges() {
    // 先卸载不需要的应用
    let unmountPromise = appsToUnmount.map(toUnMountPromise)
    // 去加载需要的应用
    // 获取需要加载的应用 加载 启动 挂载
    appsToLoad.map(async (app) => {
      app = await toLoadPromise(app)
      app = await toBootstrapPromise(app)
      return toMountPromise(app)
    })
    appsToMount.map(async (app) => {
      app = await toBootstrapPromise(app)
      return toMountPromise(app)
    })
  }

  async function loadApps() {
    // 预加载应用 就是获取到bootstrap mount和unmount方法放到app上
    let apps = await Promise.all(appsToLoad.map(toLoadPromise))
  }
}

// 这个流程是用于初始化操作的 我们还需要在路径切换时重新加载应用
// 重写路由相关的方法
