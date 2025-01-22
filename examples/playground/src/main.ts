import { createApp, h, reactive } from 'chibivue'

const app = createApp({
  template: `<b class="hello" style="color: red;">Hello World!!</b>`,
})

app.mount('#app')
