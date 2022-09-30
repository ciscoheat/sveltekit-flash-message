import type { RequestEvent, ServerLoadEvent } from "@sveltejs/kit"
import { redirect as redir } from "@sveltejs/kit"
import { parse } from 'cookie'

const d = console.debug

const cookieName = 'flash'
const httpOnly = false
const path = '/'
const maxAge = 120

const cookieHeader = (data : App.PageData['flash']) => ({
  'set-cookie': cookieName + '=' + encodeURIComponent(JSON.stringify(data)) + `; Max-Age=${maxAge}; Path=${path};`
})

/////////////////////////////////////////////////////////////////////

export function loadFlash(event : ServerLoadEvent) {
  const header = event.request.headers.get('cookie') || ''
  if(!header.includes(cookieName + '=')) {
    //d('No flash cookie found.')
    return { [cookieName]: undefined }
  }

  const cookies = parse(header)
  const dataString = cookies[cookieName]

  let data = undefined

  if(dataString) {
    // Detect if event is XMLHttpRequest, basically by checking if the browser 
    // is honoring the sec-fetch-dest header, or accepting html.
    if(event.request.headers.get('sec-fetch-dest') == 'empty' || event.request.headers.get('accept') == '*/*') {
      //d('Possible fetch request, keeping cookie for client.')
    } else {
      //d('Flash cookie found, clearing')
      event.cookies.delete(cookieName)
    }

    try {
      data = JSON.parse(dataString)
    } catch(e) {
      // Ignore data if parsing error
    }

    //d('setting flash message: ' + data)
  }

  return {
    [cookieName]: data as App.PageData['flash'] | undefined
  }
}

export const load = loadFlash

/////////////////////////////////////////////////////////////////////

export function flashMessage(data : App.PageData['flash'], redirect : string | URL | RequestEvent, event? : RequestEvent) {
  if(typeof redirect === 'string' || !('url' in redirect)) {
    if(event === undefined)
      throw new Error('flashMessage: RequestEvent not found in the event parameter.')
  } else {
    event = redirect
    redirect = event.url
  }

  event.cookies.set(cookieName, JSON.stringify(data), {httpOnly, path, maxAge})
  throw redir(303, redirect.toString())
}

export function flashResponse(data : App.PageData['flash'], redirect : string | URL, headers : Headers | Record<string, string> = {}, status = 303, statusText? : string) {
  const baseHeader = cookieHeader(data) as Record<string, string>
  baseHeader.location = typeof redirect === 'string' ? redirect : redirect.toString()

  if(headers instanceof Headers) {
    headers.forEach((key, value) => baseHeader[key] = value)
  } else {
    Object.assign(baseHeader, headers)
  }

  const options = {
    headers: baseHeader,
    status,
    statusText
  }

  return new Response(null, options)
}
