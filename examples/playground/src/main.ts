import { createApp, h, reactive } from 'chibivue'

const CounterComponent = {
  setup() {
    const state = reactive({ count: 0 })
    const increment = () => state.count++

    return () =>
      h('div', {}, [
        h('p', {}, [`count: ${state.count}`]),
        h('button', { onClick: increment }, ['increment']),
      ])
  },
}

const app = createApp({
  setup() {
    const state = reactive({ count: 0 })
    const increment = () => state.count++
    return () =>
      h('div', { id: 'my-app' }, [
        h(CounterComponent, {}, []),
        h('button', { onClick: increment }, ['root increment']),
        h('div', {}, [`root count: ${state.count}`]),
      ])
  },
})

app.mount('#app')
