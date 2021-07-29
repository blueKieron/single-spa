
import { MOUNTED, NOT_MOUNTED, UNMOUNTING } from "../applications/app.helpers";


export async function toUnMountPromise(app) {
  // 如果当前应用没有被挂载 什么都不做
  if(app.state != MOUNTED) {
    return app
  }
  app.state = UNMOUNTING
  await app.unmount(app.customProps)
  app.state = NOT_MOUNTED
  return app
}