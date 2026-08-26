export interface CookieSerializeOptions {
  domain?: string;
  encode?: (value: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: true | false | 'lax' | 'strict' | 'none';
  secure?: boolean;
}

export function serialize(name: string, value: string, options: CookieSerializeOptions = {}) {
  const encode = options.encode ?? encodeURIComponent;
  let output = `${name}=${encode(value)}`;

  if (options.maxAge != null) output += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.domain) output += `; Domain=${options.domain}`;
  if (options.path) output += `; Path=${options.path}`;
  if (options.expires) output += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) output += '; HttpOnly';
  if (options.secure) output += '; Secure';
  if (options.sameSite) {
    const sameSite = options.sameSite === true ? 'Strict' : options.sameSite;
    output += `; SameSite=${sameSite[0].toUpperCase()}${sameSite.slice(1)}`;
  }

  return output;
}
