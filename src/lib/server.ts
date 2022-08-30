import type { RequestEvent, ServerLoadEvent } from "@sveltejs/kit"
import { parse } from 'cookie'

const d = console.debug

type Message = App.PageData['flash']
const cookieName = 'flash'
const path = '/'

const cookieHeader = (data : Message) => ({
  'set-cookie': cookieName + '=' + encodeURIComponent(JSON.stringify(data)) + `; Max-Age=120; Path=${path};`
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
      event.setHeaders({'set-cookie': cookieName + `=; Max-Age=0; Path=${path};`})
    }

    try {
      data = JSON.parse(dataString)
    } catch(e) {
      // Ignore data if parsing error
    }

    //d('setting flash message: ' + data)
  }


  return {
    [cookieName]: data as Message | undefined
  }
}

export const load = loadFlash

/////////////////////////////////////////////////////////////////////

export function flashMessage(data : Message, redirect : string | URL | RequestEvent, event? : RequestEvent) {
  let location : string

  if(typeof redirect === 'string' || !('url' in redirect)) {
    if(event === undefined)
      throw new Error('flashMessage: RequestEvent not found in the event parameter.')

    event.setHeaders(cookieHeader(data))
    location = redirect.toString()
  } else {
    redirect.setHeaders(cookieHeader(data))
    location = redirect.url.toString()
  }

  return { location }
}

export function flashResponse(data : Message, redirect : string | URL, headers : Headers | Record<string, string> = {}, status = 303, statusText? : string) {
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
