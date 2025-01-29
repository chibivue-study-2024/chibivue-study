import { generate } from './codegen'
import { baseParse } from './parse'

export function baseCompile(template: string) {
  const parseResult = baseParse(template.trim()) // templateはトリムしておく

  const code = generate(parseResult)
  console.log(code)
  return code
}
