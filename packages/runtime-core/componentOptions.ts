export type ComponentOptions = {
  props?: Record<string, any>
  render?: Function
  template?: string
  setup?: (
    props: Record<string, any>,
    ctx: { emit: (event: string, ...args: any[]) => void },
  ) => Function | Record<string, unknown> | void // Record<string, unknown> も返しうるように
}
