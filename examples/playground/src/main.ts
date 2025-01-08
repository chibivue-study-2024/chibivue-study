import { createApp, h, reactive } from 'chibivue'

const MyComponent = {
  props: { message: { type: String } },

  setup(props: { message: string }) {
    console.log('props', props)
    return () => h('div', { id: 'my-app' }, [`message: ${props.message}`])
  },
}

const app = createApp({
  setup() {
    const state = reactive({ message: 'hello' })
    const changeMessage = () => {
      state.message += '!'
      console.log('state', state)
    }

    return () =>
      h('div', { id: 'my-app' }, [
        h(MyComponent, { message: state.message }, []),
        h('button', { onClick: changeMessage }, ['change message']),
      ])
  },
})
app.mount('#app')
