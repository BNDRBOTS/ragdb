import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export interface DeepSeekStreamCallbacks {
  onThinkingChunk: (chunk: string) => void
  onContentChunk: (chunk: string) => void
  onDone: (fullContent: string, fullThinking: string) => void
  onError: (error: Error) => void
}

function getDeepSeekClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('Missing DEEPSEEK_API_KEY')

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com/v1',
  })
}

export async function streamDeepSeekChat(
  messages: ChatCompletionMessageParam[],
  callbacks: DeepSeekStreamCallbacks,
  model: string = 'deepseek-reasoner'
): Promise<void> {
  const client = getDeepSeekClient()

  let fullContent = ''
  let fullThinking = ''

  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta as any

      if (delta?.reasoning_content) {
        fullThinking += delta.reasoning_content
        callbacks.onThinkingChunk(delta.reasoning_content)
      }

      if (delta?.content) {
        fullContent += delta.content
        callbacks.onContentChunk(delta.content)
      }
    }

    callbacks.onDone(fullContent, fullThinking)
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }
}
