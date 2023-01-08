import type { CookieParseOptions, CookieSerializeOptions } from './types'
export type { CookieParseOptions, CookieSerializeOptions } from './types'

/**
 * Module letiables.
 * @private
 */

const decode = decodeURIComponent;
const encode = encodeURIComponent;
const pairSplitRegExp = /; */;

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
* Parse an HTTP Cookie header string and returning an object of all cookie
* name-value pairs.
*
* @param str the string representing a `Cookie` header value
* @param [options] object containing parsing options
*/
export function parse(str: string, options?: CookieParseOptions) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  let obj = {}
  let opt = options || {};
  let pairs = str.split(pairSplitRegExp);
  let dec = opt.decode || decode;

  for (let i = 0; i < pairs.length; i++) {
    let pair = pairs[i];
    let eq_idx = pair.indexOf('=');

    // skip things that don't look like key=value
    if (eq_idx < 0) {
      continue;
    }

    let key = pair.substr(0, eq_idx).trim()
    let val = pair.substr(++eq_idx, pair.length).trim();

    // quoted values
    if ('"' == val[0]) {
      val = val.slice(1, -1);
    }

    // only assign once
    if (undefined == obj[key]) {
      obj[key] = tryDecode(val, dec);
    }
  }

  return obj;
}

/**
* Serialize a cookie name-value pair into a `Set-Cookie` header string.
*
* @param name the name for the cookie
* @param value value to set the cookie to
* @param [options] object containing serialization options
* @throws {TypeError} when `maxAge` options is invalid
*/
export function serialize(name: string, value: string, options?: CookieSerializeOptions) {
  let opt = options || {};
  let enc = opt.encode || encode;

  if (typeof enc !== 'function') {
    throw new TypeError('option encode is invalid');
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid');
  }

  let encodedValue = enc(value);

  if (encodedValue && !fieldContentRegExp.test(encodedValue)) {
    throw new TypeError('argument val is invalid');
  }

  let str = name + '=' + encodedValue;

  if (null != opt.maxAge) {
    let maxAge = opt.maxAge - 0;

    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new TypeError('option maxAge is invalid')
    }

    str += '; Max-Age=' + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError('option domain is invalid');
    }

    str += '; Domain=' + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError('option path is invalid');
    }

    str += '; Path=' + opt.path;
  }

  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== 'function') {
      throw new TypeError('option expires is invalid');
    }

    str += '; Expires=' + opt.expires.toUTCString();
  }

  if (opt.httpOnly) {
    str += '; HttpOnly';
  }

  if (opt.secure) {
    str += '; Secure';
  }

  if (opt.sameSite) {
    let sameSite = typeof opt.sameSite === 'string'
      ? opt.sameSite.toLowerCase() : opt.sameSite;

    switch (sameSite) {
      case true:
        str += '; SameSite=Strict';
        break;
      case 'lax':
        str += '; SameSite=Lax';
        break;
      case 'strict':
        str += '; SameSite=Strict';
        break;
      case 'none':
        str += '; SameSite=None';
        break;
      default:
        throw new TypeError('option sameSite is invalid');
    }
  }

  return str;
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */
function tryDecode(str, decode) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}
