import { setContext, getContext, hasContext } from 'svelte'
import { type Writable, writable, type Readable } from 'svelte/store'
import { get } from 'svelte/store'
import type { Page } from '@sveltejs/kit'

/**
 * Shim for: import { browser } from '$app/environment'
 */
let browser : boolean 
try {
  const SSR = import.meta?.env?.SSR
  browser = SSR === undefined ? true : SSR
} catch(e) {
  browser = true
}

const d = console.debug

const cookieName = 'flash'
const path = '/'

const parseCookie = (str : string) => {
  const output = {} as Record<string, string>
  if(!str) return output

  return str
    .split(';')
    .map(v => v.split('='))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim())
      return acc
    }, output)
}

function flashCookie(cookieString? : string | null) : unknown {
  if(!cookieString && browser) cookieString = document.cookie

  if(!cookieString || !cookieString.includes(cookieName + '=')) return null

  const cookies = parseCookie(cookieString)
  if(cookies[cookieName]) {
    try {
      return JSON.parse(cookies[cookieName])
    } catch(e) {
      // Ignore value if parsing failed
    } finally {
      if(browser) document.cookie = cookieName + `=; Max-Age=0; Path=${path};`
    }
  }
  return null
}

/////////////////////////////////////////////////////////////////////

export class Flash {
  readonly message : Writable<App.PageData['flash']>
  //private _message : App.PageData['flash']
  
  private readonly validate : ((value : unknown) => App.PageData['flash'] | undefined) | undefined

  constructor(page : Readable<Page>, validate? : ((value : unknown) => App.PageData['flash'] | undefined)) {
    this.validate = validate

    {
      // Use a Svelte Context as a static var, to make it accessible only per request.
      let storeExists : boolean
      try {
        // Only try/catch hasContext, so actual errors can be thrown.
        storeExists = hasContext(cookieName)
      } catch(e) {
        throw new Error('The Flash class can only be instantiated at component initalization.')
      }
    
      if(!storeExists) {
        // Get current message from page
        const pageMessage = get(page).data.flash
        const checkedMessage = this.validate ? this.validate(pageMessage) : pageMessage
        this.message = setContext(cookieName, writable(checkedMessage))
      }

      this.message = getContext(cookieName)
    }
  }

  private messageFrom(response : Response) {
    const currentMessage = flashCookie(response.headers.get('set-cookie'))
    return (this.validate ? this.validate(currentMessage) : currentMessage) as App.PageData['flash'] | undefined
  }

  setFrom(response : Response) {
    this.message.set(this.messageFrom(response))
  }

  updateFrom(response : Response) {
    const newMessage = this.messageFrom(response)

    this.message.update(prevMessage => {      
      if(newMessage === undefined)
        return prevMessage
      else if(Array.isArray(prevMessage))
        return prevMessage.concat(newMessage)
      else
        return newMessage
    })
  }
}
