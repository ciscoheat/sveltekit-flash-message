import type { RequestEvent } from "@sveltejs/kit"
import { flashMessage } from "$lib/server.js"

export async function POST(event: RequestEvent) {
  return flashMessage([{
    status: 'error', 
    text: '+page.server.ts POST ' + Date.now()
  }], event)
}