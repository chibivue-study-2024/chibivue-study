import { Dep, createDep } from './dep'

type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export let activeEffect: ReactiveEffect | undefined

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}

  run() {
    // ※ fnを実行する前のactiveEffectを保持しておいて、実行が終わった後元に戻します。
    // これをやらないと、どんどん上書きしてしまって、意図しない挙動をしてしまいます。(用が済んだら元に戻そう)
    let parent: ReactiveEffect | undefined = activeEffect
    activeEffect = this
    const res = this.fn()
    activeEffect = parent
    return res
  }
}

export function track(target: object, key: unknown) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }

  if (activeEffect) {
    dep.add(activeEffect)
  }
}

export function trigger(target: object, key?: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)

  if (dep) {
    const effects = [...dep]
    for (const effect of effects) {
      effect.run()
    }
  }
}
