export async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import("./browser")
    await worker.start({ onUnhandledRequest: "bypass" })
  }
}
