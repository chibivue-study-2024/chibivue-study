import { generate } from './codegen'
import { baseParse } from './parse'

export function baseCompile(template: string) {
  const parseResult = baseParse(template.trim()) // templateはトリムしておく
  console.log({ parseResult })
  const code = generate(parseResult)
  console.log(code)
  return code
}
