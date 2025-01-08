import { ReactiveEffect } from '../reactivity'
import {
  Component,
  ComponentInternalInstance,
  createComponentInstance,
  InternalRenderFunction,
} from './component'
import { initProps } from './componentProps'
import { createVNode, normalizeVNode, Text, VNode } from './vnode'

export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement,
> {
  createElement(type: string): HostNode // 追加

  createText(text: string): HostNode // 追加

  setElementText(node: HostNode, text: string): void

  insert(child: HostNode, parent: HostNode, anchor?: HostNode | null): void // 追加

  patchProp(el: HostElement, key: string, value: any): void

  parentNode(node: HostNode): HostElement // 追加
}
export interface RendererNode {
  [key: string]: any
}

export interface RendererElement extends RendererNode {}

export type RootRenderFunction<HostElement = RendererElement> = (
  vnode: Component,
  container: HostElement,
) => void

export function createRenderer(options: RendererOptions) {
  const {
    createElement: hostCreateElement,
    createText: hostCreateText,
    insert: hostInsert,
    patchProp: hostPatchProp,
    setElementText: hostSetText,
    parentNode: hostParentNode,
  } = options

  const processElement = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
  ) => {
    if (n1 === null) {
      mountElement(n2, container)
    } else {
      patchElement(n1, n2)
    }
  }

  const mountChildren = (children: VNode[], container: RendererElement) => {
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))
      patch(null, child, container)
    }
  }

  const mountElement = (vnode: VNode, container: RendererElement) => {
    let el: RendererElement
    const { type, props } = vnode
    el = vnode.el = hostCreateElement(type as string)

    mountChildren(vnode.children as VNode[], el)

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, props[key])
      }
    }

    hostInsert(el, container)
  }

  const patchElement = (n1: VNode, n2: VNode) => {
    const el = (n2.el = n1.el!)

    const props = n2.props

    patchChildren(n1, n2, el)

    for (const key in props) {
      if (props[key] !== n1.props?.[key]) {
        hostPatchProp(el, key, props[key])
      }
    }
  }

  const patchChildren = (n1: VNode, n2: VNode, container: RendererElement) => {
    const c1 = n1.children as VNode[]
    const c2 = n2.children as VNode[]

    for (let i = 0; i < c2.length; i++) {
      const child = (c2[i] = normalizeVNode(c2[i]))
      patch(c1[i], child, container)
    }
  }

  const processText = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
  ) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children as string)), container)
    } else {
      const el = (n2.el = n1.el!)
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children as string)
      }
    }
  }

  const patch = (n1: VNode | null, n2: VNode, container: RendererElement) => {
    const { type } = n2
    if (type === Text) {
      processText(n1, n2, container)
    } else if (typeof type === 'string') {
      processElement(n1, n2, container)
    } else if (typeof type === 'object') {
      processComponent(n1, n2, container)
    } else {
      // do nothing
    }
  }

  const processComponent = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
  ) => {
    if (n1 == null) {
      mountComponent(n2, container)
    } else {
      updateComponent(n1, n2)
    }
  }

  const mountComponent = (initialVNode: VNode, container: RendererElement) => {
    const instance: ComponentInternalInstance = (initialVNode.component =
      createComponentInstance(initialVNode))

    const { props } = instance.vnode
    initProps(instance, props)

    const component = initialVNode.type as Component
    if (component.setup) {
      instance.render = component.setup(
        instance.props,
      ) as InternalRenderFunction
    }

    setupRenderEffect(instance, initialVNode, container)
  }

  function setupRenderEffect(
    instance: ComponentInternalInstance,
    initialVNode: VNode<RendererNode>,
    container: RendererElement,
  ) {
    const componentUpdateFn = () => {
      const { render } = instance

      if (!instance.isMounted) {
        // mount process
        const subTree = (instance.subTree = normalizeVNode(render()))
        patch(null, subTree, container)
        initialVNode.el = subTree.el
        instance.isMounted = true
      } else {
        // patch process
        let { next, vnode } = instance

        if (next) {
          // とりあえず，instance 持ってる情報を新しいものに更新してると思えば OK
          next.el = vnode.el
          next.component = instance
          instance.vnode = next
          instance.next = null
        } else {
          next = vnode
        }

        const prevTree = instance.subTree
        const nextTree = normalizeVNode(render())
        instance.subTree = nextTree

        patch(prevTree, nextTree, hostParentNode(prevTree.el!)!) // ※ 1
        next.el = nextTree.el
      }
    }

    const effect = (instance.effect = new ReactiveEffect(componentUpdateFn))
    const update = (instance.update = () => effect.run()) // instance.updateに登録
    update()
  }

  const updateComponent = (n1: VNode, n2: VNode) => {
    const instance = (n2.component = n1.component)!
    instance.next = n2
    instance.update() // 更新のための関数を呼ぶ
  }

  const render: RootRenderFunction = (rootComponent, container) => {
    const vnode = createVNode(rootComponent, {}, [])
    patch(null, vnode, container)
  }
  return { render }
}
