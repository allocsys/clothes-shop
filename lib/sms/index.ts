import type { SmsProvider } from './types';
import { mockSmsProvider } from './mock';
import { kavenegarSmsProvider } from './kavenegar';

export type { SmsProvider, SendInput, SendResult } from './types';

// ADD A NEW SMS PROVIDER HERE: write lib/sms/<name>.ts implementing SmsProvider, then list it below.
const ALL: SmsProvider[] = [mockSmsProvider, kavenegarSmsProvider];

// Which provider the shop uses: SMS_PROVIDER env ("mock", "kavenegar", ...).
// Empty/unset = SMS is OFF and the shop works exactly as before.
export function activeSmsProviderId(): string | null {
  const id = (process.env.SMS_PROVIDER ?? '').trim().toLowerCase();
  return id || null;
}

// A provider without valid settings (no API key...) stays off. The fake provider reaches nobody,
// so it may only run outside production, or on staging when ALLOW_MOCK_SMS=1 is set on purpose.
function allowed(p: SmsProvider): boolean {
  if (p.configured && !p.configured()) return false;
  if (p.id !== 'mock') return true;
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_SMS === '1';
}

export function getActiveSmsProvider(): SmsProvider | null {
  const id = activeSmsProviderId();
  const p = id ? ALL.find((x) => x.id === id) : undefined;
  return p && allowed(p) ? p : null;
}

// True when SMS_PROVIDER is set but names something unknown, not configured or not allowed (a misconfiguration to warn about).
export function smsMisconfigured(): boolean {
  return activeSmsProviderId() !== null && getActiveSmsProvider() === null;
}
