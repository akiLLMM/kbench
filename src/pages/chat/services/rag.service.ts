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

export async function streamRag(
  context: RagContext,
  onChunk: (chunk: string) => void
): Promise<void> {
  // 模拟 20% 失败概率
  const shouldFail = Math.random() < 0.2

  if (shouldFail) {
    await sleep(500)
    throw new Error("RAG service unavailable")
  }

  const fullAnswer = `
【Mock Streaming RAG Answer】

问题：
${context.question}

参考知识：
${context.knowledge.map(k => `- ${k.title}`).join("\n")}

这是一个逐字输出的示例回答。
`.trim()

  // 模拟逐字 / 逐词输出
  for (const char of fullAnswer) {
    await sleep(30)
    onChunk(char)
  }
}
