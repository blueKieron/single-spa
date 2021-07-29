import { BOOTSTRAPPING, NOT_BOOTSTRAPPED, NOT_MOUNTED } from "../applications/app.helpers";

export async function toBootstrapPromise(app) {
  if (app.state !== NOT_BOOTSTRAPPED){
    return app
  }
  app.state = BOOTSTRAPPING
  await app.bootstrap(app.customProps)
  app.state = NOT_MOUNTED
  return app
}
