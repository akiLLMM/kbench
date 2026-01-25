export interface RagKnowledgeRef {
  id: string
  title: string
}

export interface RagContext {
  question: string
  knowledge: RagKnowledgeRef[]
}

export interface RagResult {
  answer: string
}

export async function askRag(
  context: RagContext
): Promise<RagResult> {
  // 仍保留 mock 版本（可选）
  await sleep(800)

  const titles = context.knowledge
    .map(k => `《${k.title}》`)
    .join("、")

  return {
    answer: `
【Mock RAG Answer】

问题：
${context.question}

参考知识：
${titles || "（未选择知识）"}

（此处将来替换为真实 RAG / 后端）
`.trim()
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 流式调用：改成真实 fetch("/api/chat/stream")
 */
export async function streamRag(
  context: RagContext,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: context.question,
      knowledge: context.knowledge
    })
  })

  if (!response.ok) {
    throw new Error(`Chat API Error: ${response.status}`)
  }

  if (!response.body) {
    throw new Error("Empty response body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    onChunk(chunk)
  }
}
