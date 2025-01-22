// これは Node の種類を表すものです。
// 注意するべき点としては、ここでいう Node というのは HTML の Node のことではなく、あくまでこのテンプレートコンパイラで扱う粒度であるということです。
// なので、 Element やTextだけでなく Attribute も一つの Node として扱われます。
// これは Vue.js の設計に沿った粒度で、今後、ディレクティブを実装する際などに役に立ちます。
export const enum NodeTypes {
  ELEMENT,
  TEXT,
  ATTRIBUTE,
}

// 全ての Node は type と loc を持っています。
// loc というのは location のことで、この Node がソースコード(テンプレート文字列)のどこに該当するかの情報を保持します。
// (何行目のどこにあるかなど)
export interface Node {
  type: NodeTypes
  loc: SourceLocation
}

// Element の Node です。
export interface ElementNode extends Node {
  type: NodeTypes.ELEMENT
  tag: string // eg. "div"
  props: Array<AttributeNode> // eg. { name: "class", value: { content: "container" } }
  children: TemplateChildNode[]
  isSelfClosing: boolean // eg. <img /> -> true
}

// ElementNode が持つ属性です。
// ただの Record<string, string> と表現してしまってもいいのですが、
// Vue に倣って name(string) と value(TextNode) を持つようにしています。
export interface AttributeNode extends Node {
  type: NodeTypes.ATTRIBUTE
  name: string
  value: TextNode | undefined
}

export type TemplateChildNode = ElementNode | TextNode

export interface TextNode extends Node {
  type: NodeTypes.TEXT
  content: string
}

// location の情報です。 Node はこの情報を持ちます。
// start, end に位置情報が入ります。
// source には実際のコード(文字列)が入ります。
export interface SourceLocation {
  start: Position
  end: Position
  source: string
}

export interface Position {
  offset: number // from start of file
  line: number
  column: number
}
