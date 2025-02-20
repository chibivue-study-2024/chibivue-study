import { createFilter, type Plugin } from 'vite'
import { parse, rewriteDefault } from '../../compiler-sfc'
import { compile } from '../../compiler-dom'
import fs from 'node:fs'

export default function vitePluginChibivue(): Plugin {
  const filter = createFilter(/\.vue$/)

  return {
    name: 'vite:chibivue',

    resolveId(id) {
      // このidは実際には存在しないパスだが、loadで仮想的にハンドリングするのでidを返してあげる (読み込み可能だということにする)
      if (id.match(/\.vue\.css$/)) return id

      // ここでreturnされないidに関しては、実際にそのファイルが存在していたらそのファイルが解決されるし、存在していなければ存在しないというエラーになる
    },
    load(id) {
      // .vue.cssがloadされた (importが宣言され、読み込まれた) ときのハンドリング
      if (id.match(/\.vue\.css$/)) {
        const filename = id.replace(/\.css$/, '')
        const content = fs.readFileSync(filename, 'utf-8') // 普通にSFCファイルを取得
        const { descriptor } = parse(content, { filename }) //  SFCをパース

        // contentをjoinsして結果とする。
        const styles = descriptor.styles.map(it => it.content).join('\n')
        return { code: styles }
      }
    },
    transform(code, id) {
      if (!filter(id)) return
      const outputs = []
      outputs.push("import * as ChibiVue from 'chibivue'\n")
      outputs.push(`import '${id}.css'`) // ${id}.cssのimport文を宣言しておく

      const { descriptor } = parse(code, { filename: id })

      const SFC_MAIN = '_sfc_main'
      const scriptCode = rewriteDefault(
        descriptor.script?.content ?? '',
        SFC_MAIN,
      )
      outputs.push(scriptCode)

      const templateCode = compile(descriptor.template!.content ?? '', {
        isBrowser: false,
      })
      outputs.push(templateCode)
      outputs.push('\n')
      outputs.push(`export default { ...${SFC_MAIN}, render }`) // ここ
      return { code: outputs.join('\n') }
    },
  }
}
