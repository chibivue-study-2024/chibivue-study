import { baseCompile, baseParse } from '../compiler-core'
import { CompilerOptions } from '../compiler-core/options'

export function compile(template: string, option?: CompilerOptions) {
  const defaultOptions: Required<CompilerOptions> = {
    isBrowser: true,
  }
  return baseCompile(template, defaultOptions)
}

export function parse(template: string) {
  return baseParse(template)
}
