import { ElementNode, NodeTypes, TemplateChildNode } from './ast'

export interface ParserContext {
  // 元々のテンプレート文字列
  readonly originalSource: string
  source: string
  // このパーサが読み取っている現在地
  offset: number
  line: number
  column: number
}

function createParserContext(content: string): ParserContext {
  return {
    originalSource: content,
    source: content,
    column: 1,
    line: 1,
    offset: 0,
  }
}

export const baseParse = (
  content: string,
): { children: TemplateChildNode[] } => {
  const context = createParserContext(content)
  const children = parseChildren(context, []) // 子ノードをパースする
  return { children: children }
}

function parseChildren(
  context: ParserContext,

  // HTMLは再起的な構造を持っているので、祖先要素をスタックとして持っておいて、子にネストして行くたびにpushしていきます。
  // endタグを見つけるとparseChildrenが終了してancestorsをpopする感じです。
  ancestors: ElementNode[],
): TemplateChildNode[] {
  const nodes: TemplateChildNode[] = []

  while (!isEnd(context, ancestors)) {
    const s = context.source
    let node: TemplateChildNode | undefined = undefined

    if (s[0] === '<') {
      // sが"<"で始まり、かつ次の文字がアルファベットの場合は要素としてパースします。
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors) // TODO: これから実装します。
      }
    }

    if (!node) {
      // 上記の条件に当てはまらなかった場合はTextNodeとしてパースします。
      node = parseText(context) // TODO: これから実装します。
    }

    pushNode(nodes, node)
  }

  return nodes
}

// 子要素パースの while を判定(パース終了)するための関数
function isEnd(context: ParserContext, ancestors: ElementNode[]): boolean {
  const s = context.source

  // sが"</"で始まり、かつその後にancestorsのタグ名が続くことを判定し、閉じタグがあるか(parseChildrenが終了するべきか)を判定します。
  if (startsWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; --i) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true
      }
    }
  }

  return !s
}

function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString)
}

function pushNode(nodes: TemplateChildNode[], node: TemplateChildNode): void {
  // nodeTypeがTextのものが連続している場合は結合してあげます
  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes)
    if (prev && prev.type === NodeTypes.TEXT) {
      prev.content += node.content
      return
    }
  }

  nodes.push(node)
}

function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1]
}

function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    startsWith(source, '</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  )
}
