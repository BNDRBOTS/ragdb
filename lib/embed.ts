import OpenAI from 'openai'

function getEmbeddingClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')
  return new OpenAI({ apiKey })
}

export async function embedText(text: string): Promise<number[]> {
  const client = getEmbeddingClient()
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  })
  return response.data[0].embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const client = getEmbeddingClient()
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float',
  })
  return response.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding)
}
