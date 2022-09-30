import type { RequestEvent } from "@sveltejs/kit"
import { flashMessage } from "$lib/server.js"

export const actions = {
  default: async (event : RequestEvent) => {
    return flashMessage([{
      status: 'error', 
      text: '+page.server.ts POST ' + Date.now()
    }], event)  
  }
}

