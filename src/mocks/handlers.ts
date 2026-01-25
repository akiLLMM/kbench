import { delay, http, HttpResponse } from "msw"

function getDb() {
  const raw = localStorage.getItem("ai-workbench-knowledge-list")
  return raw ? JSON.parse(raw) : []
}

export const handlers = [
  // knowledge list
  http.get("/api/knowledge/list", async () => {
    await delay(300)
    return HttpResponse.json({
      code: 0,
      data: getDb()
    })
  }),

  // chat stream
  http.post("/api/chat/stream", async ({ request }) => {
    const body = (await request.json()) as { question: string, knowledge: { id: string, title: string }[] }

    await delay(300)

    const titles = body.knowledge?.map(k => `《${k.title}》`).join("、") || "（未选择知识）"
    const text = `【Mock Stream】\n问题：${body.question}\n参考：${titles}\n\n这是 MSW 模拟的流式输出。`

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        for (const ch of text) {
          controller.enqueue(encoder.encode(ch))
          await new Promise(r => setTimeout(r, 20))
        }
        controller.close()
      }
    })

    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    })
  })
]
