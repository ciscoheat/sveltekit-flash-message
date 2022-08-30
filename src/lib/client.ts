import { setContext, getContext, hasContext } from 'svelte'
import { type Writable, writable } from 'svelte/store'
import { get } from 'svelte/store'
import { page } from '$app/stores'
import { browser } from '$app/environment'

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

function flashStore<T>(checkValue? : ((value : unknown) => T | null)) {
  let storeExists : boolean
  try {
    storeExists = hasContext(cookieName)
  } catch(e) {
    throw new Error('flashStore can only be called at component initalization.')
  }

  if(!storeExists) {
    let storeValue = getFlashMessage()
    if(checkValue) storeValue = checkValue(storeValue)
    
    return setContext(cookieName, writable<T>(storeValue as T | undefined))

  } else if(checkValue) {
    throw new Error('flashStore has already been initialized. Remove the checkValue function from the last call to flashStore.')
  } else {
    return getContext(cookieName) as Writable<T>
  }
}

function flashCookie() : unknown {
  if(browser) {
    if(!document.cookie.includes(cookieName + '=')) return null

    const cookies = parseCookie(document.cookie)
    if(cookies[cookieName]) {
      try {
        //d('[getFlash] Found cookie on client!')
        //d(cookies[cookieName])
        return JSON.parse(cookies[cookieName])
      } catch(e) {
        // Ignore value if parsing failed
      } finally {
        document.cookie = cookieName + `=; Max-Age=0; Path=${path};`
      }
    }
  } 
  return null
}

/////////////////////////////////////////////////////////////////////

export function getFlashMessage<T>() {
  return (flashCookie() || get(page).data.flash) as T | undefined
}

export function getFlashStore<T>(checkValue? : ((value : unknown) => T | null)) : Writable<T> {
    return flashStore<T>(checkValue)
}

export function addFlashMessage<T>(prevMessage : T) {
  const message = getFlashMessage<T>()
  if(message === undefined) 
    return prevMessage
  else if(Array.isArray(prevMessage))
    return prevMessage.concat(message)
  else {
    return message
  }
}
