// Small HTTPS helpers for payment gateways and SMS providers.
// A timeout is mandatory: a hanging gateway must never freeze checkout.

async function postRaw(url: string, contentType: string, body: string, timeoutMs: number): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': contentType, Accept: 'application/json' },
      body,
      signal: ctl.signal,
      cache: 'no-store',
    });
    // 5xx = the gateway itself is broken or down: throw, so the caller treats it as "unknown", never as "failed".
    if (res.status >= 500) throw new Error('gateway HTTP ' + res.status);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('gateway HTTP ' + res.status + ' with a non-JSON answer');
    }
    // A 4xx with a JSON body is a normal gateway answer (errors come in the body), so it is returned, not thrown.
  } finally {
    clearTimeout(timer);
  }
}

export function postJson(url: string, body: unknown, timeoutMs = 10000): Promise<unknown> {
  return postRaw(url, 'application/json', JSON.stringify(body), timeoutMs);
}

// Classic form post (application/x-www-form-urlencoded, UTF-8): Persian text is encoded for you.
export function postForm(url: string, fields: Record<string, string>, timeoutMs = 10000): Promise<unknown> {
  return postRaw(url, 'application/x-www-form-urlencoded; charset=utf-8', new URLSearchParams(fields).toString(), timeoutMs);
}
