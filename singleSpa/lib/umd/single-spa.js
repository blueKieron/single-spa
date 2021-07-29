(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singleSpa = {}));
}(this, (function (exports) { 'use strict';

  // 描述应用的整个状态
  const NOT_LOADED = 'NOT_LOADED';// 应用初始状态
  const LOADING_SOURCE_CODE ='LOADING_SOURCE_CODE'; // 加载资源
  const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'; // 还没有调用bootstrap方法
  const BOOTSTRAPPING = 'BOOTSTRAPPING'; // 启动中
  const NOT_MOUNTED = 'NOT_MOUNTED';// 没有调用mount方法
  const MOUNTING = 'MOUNTING'; // 正在挂载中
  const MOUNTED = 'MOUNTED'; // 挂载完毕
  const UNMOUNTING = 'UNMOUNTING'; // 解除挂载
  // 当前这个应用是否要被激活
  function shouldBeActive(app){ //如果返回true 那么应用应该就开始初始化等一系列操作
    return app.activeWhen(window.location)
  }

  async function toBootstrapPromise(app) {
    if (app.state !== NOT_BOOTSTRAPPED){
      return app
    }
    app.state = BOOTSTRAPPING;
    await app.bootstrap(app.customProps);
    app.state = NOT_MOUNTED;
    return app
  }

  function flattenFnArray(fns) {
    fns = Array.isArray(fns) ? fns : [fns];
    // 通过promise链来链式调用
    return (props) =>
      fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve());
  }

  async function toLoadPromise(app) {
    if (app.loadPromise) {
      return app.loadPromise; // 缓存机制
    }
    return (app.loadPromise = Promise.resolve().then(async () => {
      app.state = LOADING_SOURCE_CODE;

      let { bootstrap, mount, unmount } = await app.loadApp(app.customProps);
      app.state = NOT_BOOTSTRAPPED;
      // 将多个promise组合在一起
      app.bootstrap = flattenFnArray(bootstrap);
      app.mount = flattenFnArray(mount);
      app.unmount = flattenFnArray(unmount);
      delete app.loadPromise;
      return app;
    }));
  }

  async function toMountPromise(app) {
    if (app.state !== NOT_MOUNTED){
      return app
    }
    app.state = MOUNTING;
    await app.mount(app.customProps);
    app.state = MOUNTED;
    return app
  }

  async function toUnMountPromise(app) {
    // 如果当前应用没有被挂载 什么都不做
    if(app.state != MOUNTED) {
      return app
    }
    app.state = UNMOUNTING;
    await app.unmount(app.customProps);
    app.state = NOT_MOUNTED;
    return app
  }

  let started = false;
  // 挂载应用
  function start() {
    started = true;
    reroute(); // 除了去加载应用还要去挂载应用
  }

  const routingEventsListeningTo = ["hashchange", "popstate"];

  function urlReroute() {
    reroute(); // 会根据路径重新加载不同的应用
  }

  // 后续挂载的事件先暂存起来
  const capturedEventListeners = {
    hashchange: [],
    popstate: [],
  };

  // 我们处理应用加载的逻辑是在最前面
  window.addEventListener("hashchange", urlReroute);
  window.addEventListener("popstate", urlReroute);

  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  window.addEventListener = function (event, fn) {
    if (
      routingEventsListeningTo.indexOf(event) >= 0 &&
      !capturedEventListeners[event].some((listener) => listener == fn)
    ) {
      capturedEventListeners[event].push(fn);
      return
    }
    return originalAddEventListener.apply(this, arguments)
  };
  window.removeEventListener = function (event, fn) {
    if(routingEventsListeningTo.indexOf(event) >=0 ) {
      capturedEventListeners[event] = capturedEventListeners[event].filter(listener => listener !== fn);
      return
    }
    return originalRemoveEventListener.apply(this, arguments)
  };

  // 用户可能还会绑定自己的路由事件 vue

  // 当我们应用切换后，还需要处理原来的方法，需要在应用切换后再执行

  // 核心应用处理方
  function reroute() {

    // 需要获取要加载的应用
    // 需要获取要被挂载的应用
    // 哪些应用需要被卸载
    const {appsToLoad, appsToMount, appsToUnmount} = getAppChanges();
    if (started) {
      // app装载
      return performAppChanges() // 根据路径来装载应用
    } else {
      // 注册应用时，需要预先加载
      return loadApps() // 预加载应用
    }

    async function performAppChanges() {
      // 先卸载不需要的应用
      appsToUnmount.map(toUnMountPromise);
      // 去加载需要的应用
      // 获取需要加载的应用 加载 启动 挂载
      appsToLoad.map(async (app) => {
        app = await toLoadPromise(app);
        app = await toBootstrapPromise(app);
        return toMountPromise(app)
      });
      appsToMount.map(async (app) => {
        app = await toBootstrapPromise(app);
        return toMountPromise(app)
      });
    }

    async function loadApps() {
      // 预加载应用 就是获取到bootstrap mount和unmount方法放到app上
      await Promise.all(appsToLoad.map(toLoadPromise));
    }
  }

  // 这个流程是用于初始化操作的 我们还需要在路径切换时重新加载应用
  // 重写路由相关的方法

  const apps  = []; // 用来存放所有的应用

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
  function registerApplication(appName, loadApp, activeWhen, customProps) {
    apps.push({ // 将应用注册好
      appName,
      loadApp,
      activeWhen,
      customProps,
      state: NOT_LOADED
    });
    reroute(); // 加载应用
  }

  function getAppChanges() {
    const appsToUnmount = []; // 要卸载的应用
    const appsToLoad = []; // 要加载的应用
    const appsToMount = []; // 要挂载的应用

    apps.forEach(app => {
      const appShouldBeActive = shouldBeActive(app);
      switch(app.state) {
        case NOT_LOADED:
        case LOADING_SOURCE_CODE:
          if(appShouldBeActive) {
            appsToLoad.push(app);
          }
          break
        case NOT_BOOTSTRAPPED:
        case BOOTSTRAPPING:
        case NOT_MOUNTED:
          if(appShouldBeActive){
            appsToMount.push(app);
          }
          break
        case MOUNTED:
          if(!appShouldBeActive) {
            appsToUnmount.push(app);
          }
          break
      }
    });
    return {appsToUnmount, appsToLoad, appsToMount}
  }

  exports.registerApplication = registerApplication;
  exports.start = start;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=single-spa.js.map
