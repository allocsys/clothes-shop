import { randomBytes } from 'node:crypto';
import type { PaymentProvider } from './types';

// FAKE gateway for testing the whole payment flow without money.
// The customer lands on /pay/mock and presses "Pay" or "Cancel".
// It is refused in production unless ALLOW_MOCK_PAYMENT=1 (see index.ts).

export const mockProvider: PaymentProvider = {
  id: 'mock',
  label: 'درگاه آزمایشی',

  async start({ orderCode, amount }) {
    const reference = 'MOCK' + randomBytes(8).toString('hex').toUpperCase();
    const q = new URLSearchParams({ ref: reference, order: orderCode, amount: String(amount) });
    return { reference, redirectUrl: '/pay/mock?' + q.toString() };
  },

  parseCallback(cb) {
    const reference = cb.ref && /^MOCK[0-9A-F]{16}$/.test(cb.ref) ? cb.ref : null;
    return { reference, cancelled: cb.status !== 'OK' };
  },

  async verify({ reference, callback }) {
    if (callback.status !== 'OK') return { ok: false, error: 'پرداخت لغو شد' };
    return { ok: true, gatewayRef: 'R-' + reference.slice(4, 12), cardMask: '6037-99**-****-0000' };
  },
};
