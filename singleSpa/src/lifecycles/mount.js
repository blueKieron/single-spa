import { MOUNTED, MOUNTING, NOT_MOUNTED } from "../applications/app.helpers"

export async function toMountPromise(app) {
  if (app.state !== NOT_MOUNTED){
    return app
  }
  app.state = MOUNTING
  await app.mount(app.customProps)
  app.state = MOUNTED
  return app
}