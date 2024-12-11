import { createVNode, VNode, VNodeProps } from './vnode'

export function h(
  type: string,
  props: VNodeProps,
  children: (VNode | string)[],
) {
  return createVNode(type, props, children)
}
