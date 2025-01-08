export type ComponentOptions = {
  props?: Record<string, any>
  render?: Function
  setup?: (props: Record<string, any>) => Function
}
