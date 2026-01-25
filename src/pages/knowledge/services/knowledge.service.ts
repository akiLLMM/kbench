import type { KnowledgeItem } from "../types"

export async function fetchKnowledgeList(): Promise<KnowledgeItem[]> {
  const response = await fetch("/api/knowledge/list")

  if (!response.ok) {
    throw new Error(`Knowledge API Error: ${response.status}`)
  }

  const res = await response.json()
  return res.data as KnowledgeItem[]
}
