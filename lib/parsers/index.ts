export { parsePdf } from './pdf'
export { parseDocx } from './docx'
export { parseXlsx } from './xlsx'
export { parseTxt } from './txt'

import { parsePdf } from './pdf'
import { parseDocx } from './docx'
import { parseXlsx } from './xlsx'
import { parseTxt } from './txt'

const MIME_DISPATCH: Record<string, (buffer: Buffer) => Promise<string>> = {
  'application/pdf': parsePdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': parseDocx,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': parseXlsx,
  'text/plain': parseTxt,
  'text/markdown': parseTxt,
}

export async function parseDocument(buffer: Buffer, mimeType: string): Promise<string> {
  const parser = MIME_DISPATCH[mimeType]
  if (!parser) {
    throw new Error(`Unsupported MIME type: ${mimeType}`)
  }
  return parser(buffer)
}
