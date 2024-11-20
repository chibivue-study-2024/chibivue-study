import { RendererOptions } from '../runtime-core'

export const nodeOps: Omit<RendererOptions, 'patchProp'> = {
  // 追加
  createElement: tagName => {
    return document.createElement(tagName)
  },

  // 追加
  createText: (text: string) => {
    return document.createTextNode(text)
  },

  setElementText(node, text) {
    node.textContent = text
  },

  // 追加
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },
}
