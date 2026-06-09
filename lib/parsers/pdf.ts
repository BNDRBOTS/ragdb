import { getDocumentProxy, extractText } from 'unpdf'

// unpdf ships a serverless-safe pdfjs build: no worker, no canvas, no native
// deps. Correct for Node route handlers on Railway / Vercel.
export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}
