import { parse } from '@babel/parser'
import MagicString from 'magic-string'
const defaultExportRE = /((?:^|\n|;)\s*)export(\s*)default/
const namedDefaultExportRE = /((?:^|\n|;)\s*)export(.+)(?:as)?(\s*)default/s

export function rewriteDefault(input: string, as: string): string {
  if (!hasDefaultExport(input)) {
    return input + `\nconst ${as} = {}`
  }

  const s = new MagicString(input)
  const ast = parse(input, {
    sourceType: 'module',
  }).program.body

  ast.forEach(node => {
    // default exportの場合
    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'ClassDeclaration') {
        // `export default class Hoge {}` だった場合は、`class Hoge {}` に置き換える
        s.overwrite(node.start!, node.declaration.id.start!, `class `)
        // その上で、`const ${as} = Hoge;` というようなコードを末尾に追加してあげればOK.
        s.append(`\nconst ${as} = ${node.declaration.id.name}`)
      } else {
        // それ以外の default exportは宣言部分を変数宣言に置き換えてあげればOk.
        // eg 1) `export default { setup() {}, }`  ->  `const ${as} = { setup() {}, }`
        // eg 2) `export default Hoge`  ->  `const ${as} = Hoge`
        s.overwrite(node.start!, node.declaration.start!, `const ${as} = `)
      }
    }

    // named export の場合でも宣言中に default exportが発生する場合がある.
    // 主に3パターン
    //   1. `export { default } from "source";`のような宣言の場合
    //   2. `export { hoge as default }` from 'source' のような宣言の場合
    //   3. `export { hoge as default }` のような宣言の場合
    if (node.type === 'ExportNamedDeclaration') {
      for (const specifier of node.specifiers) {
        if (
          specifier.type === 'ExportSpecifier' &&
          specifier.exported.type === 'Identifier' &&
          specifier.exported.name === 'default'
        ) {
          // `from`というキーワードがある場合
          if (node.source) {
            if (specifier.local.name === 'default') {
              // 1. `export { default } from "source";`のような宣言の場合
              // この場合はimport文に抜き出して名前をつけてあげ、最終的な変数にバインドする
              // eg) `export { default } from "source";`  ->  `import { default as __VUE_DEFAULT__ } from 'source'; const ${as} = __VUE_DEFAULT__`
              const end = specifierEnd(input, specifier.local.end!, node.end!)
              s.prepend(
                `import { default as __VUE_DEFAULT__ } from '${node.source.value}'\n`,
              )
              s.overwrite(specifier.start!, end, ``)
              s.append(`\nconst ${as} = __VUE_DEFAULT__`)
              continue
            } else {
              // 2. `export { hoge as default }` from 'source' のような宣言の場合
              // この場合は一度全てのspecifierをそのままimport文に書き換え、as defaultになっている変数を最終的な変数にバインドする
              // eg) `export { hoge as default } from "source";`  ->  `import { hoge } from 'source'; const ${as} = hoge
              const end = specifierEnd(
                input,
                specifier.exported.end!,
                node.end!,
              )
              s.prepend(
                `import { ${input.slice(
                  specifier.local.start!,
                  specifier.local.end!,
                )} } from '${node.source.value}'\n`,
              )

              // 3. `export { hoge as default }`のような宣言の場合
              // この場合は単純に最終的な変数にバインドしてあげる
              s.overwrite(specifier.start!, end, ``)
              s.append(`\nconst ${as} = ${specifier.local.name}`)
              continue
            }
          }
          const end = specifierEnd(input, specifier.end!, node.end!)
          s.overwrite(specifier.start!, end, ``)
          s.append(`\nconst ${as} = ${specifier.local.name}`)
        }
      }
    }
  })
  return s.toString()
}

export function hasDefaultExport(input: string): boolean {
  return defaultExportRE.test(input) || namedDefaultExportRE.test(input)
}

// 宣言文の終端を算出する
function specifierEnd(input: string, end: number, nodeEnd: number | null) {
  // export { default   , foo } ...
  let hasCommas = false
  let oldEnd = end
  while (end < nodeEnd!) {
    if (/\s/.test(input.charAt(end))) {
      end++
    } else if (input.charAt(end) === ',') {
      end++
      hasCommas = true
      break
    } else if (input.charAt(end) === '}') {
      break
    }
  }
  return hasCommas ? end : oldEnd
}
