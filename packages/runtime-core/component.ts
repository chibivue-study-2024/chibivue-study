import { ReactiveEffect } from '../reactivity'
import { ComponentOptions } from './componentOptions'
import { RendererElement } from './renderer'
import { emit } from './componentEmits'
import { normalizeVNode, VNode, VNodeChild } from './vnode'
import { initProps } from './componentProps'

export type Component = ComponentOptions
type CompileFunction = (template: string) => InternalRenderFunction
let compile: CompileFunction | undefined

export function registerRuntimeCompiler(_compile: any) {
  compile = _compile
}

export interface ComponentInternalInstance {
  type: Component // 元となるユーザー定義のコンポーネント (旧 rootComponent (実際にはルートコンポーネントだけじゃないけど))
  vnode: VNode // 後述
  subTree: VNode // 旧 n1
  next: VNode | null // 旧 n2
  effect: ReactiveEffect // 旧 effect
  render: InternalRenderFunction // 旧 componentRender
  update: () => void // 旧updateComponent
  isMounted: boolean
  propsOptions: Record<string, any>
  props: Record<string, any>
  emit: (event: string, ...args: any[]) => void
}

export type InternalRenderFunction = {
  (): VNodeChild
}

export function createComponentInstance(
  vnode: VNode,
): ComponentInternalInstance {
  const type = vnode.type as Component

  const instance: ComponentInternalInstance = {
    type,
    vnode,
    next: null,
    effect: null!,
    subTree: null!,
    update: null!,
    render: null!,
    isMounted: false,
    propsOptions: type.props || {},
    props: {},
    emit: null!,
  }

  instance.emit = emit.bind(null, instance)
  return instance
}

export const setupComponent = (instance: ComponentInternalInstance) => {
  const { props } = instance.vnode
  initProps(instance, props)

  const component = instance.type as Component
  if (component.setup) {
    instance.render = component.setup(instance.props, {
      emit: instance.emit,
    }) as InternalRenderFunction
  }

  // ------------------------ ここ
  if (compile && !component.render) {
    const template = component.template ?? ''
    if (template) {
      instance.render = compile(template)
    }
  }
}
