// ~/packages/runtime-core apiCreateApp.ts

import { ReactiveEffect } from '../reactivity/effect'
import { Component } from './component'
import { RootRenderFunction } from './renderer'

export interface App<HostElement = any> {
  mount(rootContainer: HostElement | string): void
}

export type CreateAppFunction<HostElement> = (
  rootComponent: Component,
) => App<HostElement>

export function createAppAPI<HostElement>(
  render: RootRenderFunction<HostElement>,
): CreateAppFunction<HostElement> {
  return function createApp(rootComponent) {
    const app: App = {
      mount(rootContainer: HostElement) {
        const componentRender = rootComponent.setup!()
    
        const updateComponent = () => {
          const vnode = componentRender()
          render(vnode, rootContainer)
        }
    
        // ここから
        const effect = new ReactiveEffect(updateComponent)
        effect.run()
        // ここまで
      },
    }

    return app
  }
}
