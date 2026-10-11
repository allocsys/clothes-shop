// Small JSON-over-HTTPS helper for payment gateways (and later SMS providers).
// A timeout is mandatory: a hanging gateway must never freeze checkout.

export async function postJson(url: string, body: unknown, timeoutMs = 10000): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
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
