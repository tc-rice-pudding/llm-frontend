/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/vue" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@xenova/transformers' {
  export interface Pipeline {
    (text: string | string[]): Promise<any>
  }
  
  export function pipeline(
    task: string,
    model?: string,
    options?: any
  ): Promise<Pipeline>
}