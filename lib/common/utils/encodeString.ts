import _toString from 'lodash/toString.js';

export function encodeString(str: unknown) {
  const tempStr = _toString(str);

  return encodeURIComponent(tempStr).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}
