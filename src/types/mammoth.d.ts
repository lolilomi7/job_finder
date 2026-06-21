declare module 'mammoth' {
  interface ConversionResult {
    value: string
    messages: Array<{ type: string; message: string; error?: unknown }>
  }
  export function extractRawText(options: {
    arrayBuffer: ArrayBuffer
  }): Promise<ConversionResult>
}
