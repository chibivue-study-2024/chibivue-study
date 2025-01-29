import { TemplateChildNode } from './ast'

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
  const context = createParserContext(content) // contextを生成

  // TODO:
  return { children: [] }
}
