import { Buffer } from 'buffer';

type HeadersMap = Record<string, string>;

function normalizeHeaders(headers: HeadersInit | undefined): HeadersMap {
  const out: HeadersMap = {};
  if (!headers) return out;

  const h = new Headers(headers);
  h.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

function toBody(content: any): BodyInit | undefined {
  if (content == null) return undefined;
  if (typeof content === 'string') return content;
  if (content instanceof ArrayBuffer) return content;
  if (ArrayBuffer.isView(content)) return content as ArrayBufferView;
  if (Buffer.isBuffer(content)) return content;
  return content as BodyInit;
}

export async function request(url: string, args: any) {
  args = args || {};
  const method = (args.method || 'GET').toUpperCase();
  const headers: HeadersInit = args.headers || {};

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeoutMs = typeof args.timeout === 'number' ? args.timeout : undefined;
  let timer: any;
  if (controller && timeoutMs && timeoutMs > 0) {
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: toBody(args.content ?? args.stream),
      signal: controller?.signal
    });

    const arrayBuffer = await res.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    const respHeaders = normalizeHeaders(res.headers);
    return {
      data,
      status: res.status,
      headers: respHeaders,
      res: {
        statusCode: res.status,
        headers: respHeaders
      }
    };
  } catch (err: any) {
    // Align with previous `urllib`-style errors for retry logic.
    const e: any = err instanceof Error ? err : new Error(String(err));
    e.status = err?.name === 'AbortError' ? -2 : -1;
    e.name = err?.name === 'AbortError' ? 'ConnectionTimeoutError' : (e.name || 'RequestError');
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default { request };

