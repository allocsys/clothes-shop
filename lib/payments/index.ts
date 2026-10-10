import type { PaymentProvider } from './types';
import { mockProvider } from './mock';

export type { PaymentProvider, StartInput, StartResult, VerifyInput, VerifyResult, CallbackData, ParsedCallback } from './types';

// ADD A NEW GATEWAY HERE: write lib/payments/<name>.ts implementing PaymentProvider, then list it below.
const ALL: PaymentProvider[] = [mockProvider];

// Which gateway the shop uses: PAYMENT_PROVIDER env ("mock", later "zarinpal", ...).
// Empty/unset = online payment is OFF and orders work as before (customer pays offline).
export function activeProviderId(): string | null {
  const id = (process.env.PAYMENT_PROVIDER ?? '').trim().toLowerCase();
  return id || null;
}

// The fake gateway takes no money, so it may only run outside production,
// or on staging when ALLOW_MOCK_PAYMENT=1 is set on purpose.
function allowed(p: PaymentProvider): boolean {
  if (p.id !== 'mock') return true;
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_PAYMENT === '1';
}

export function getProvider(id: string): PaymentProvider | null {
  const p = ALL.find((x) => x.id === id);
  return p && allowed(p) ? p : null;
}

export function getActiveProvider(): PaymentProvider | null {
  const id = activeProviderId();
  return id ? getProvider(id) : null;
}

// True when PAYMENT_PROVIDER is set but names something unknown or not allowed (a misconfiguration to warn about).
export function providerMisconfigured(): boolean {
  return activeProviderId() !== null && getActiveProvider() === null;
}
