import { reroute } from "./reroute";

export const routingEventsListeningTo = ["hashchange", "popstate"];

function urlReroute() {
  reroute([], arguments); // 会根据路径重新加载不同的应用
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
    capturedEventListeners[event].push(fn)
    return
  }
  return originalAddEventListener.apply(this, arguments)
};
window.removeEventListener = function (event, fn) {
  if(routingEventsListeningTo.indexOf(event) >=0 ) {
    capturedEventListeners[event] = capturedEventListeners[event].filter(listener => listener !== fn)
    return
  }
  return originalRemoveEventListener.apply(this, arguments)
};

// 用户可能还会绑定自己的路由事件 vue

// 当我们应用切换后，还需要处理原来的方法，需要在应用切换后再执行
