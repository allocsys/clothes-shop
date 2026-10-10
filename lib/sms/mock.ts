import type { SmsProvider } from './types';

// FAKE provider for testing: sends nothing, only writes the message to the server log.
export const mockSmsProvider: SmsProvider = {
  id: 'mock',
  label: 'SMS آزمایشی',
  async send({ to, text }) {
    const masked = to.length >= 8 ? to.slice(0, 4) + '***' + to.slice(-4) : '***';
    console.log('SMS_MOCK to=' + masked + ' text=' + JSON.stringify(text));
    return { ok: true, reference: 'mock-' + Date.now().toString(36) };
  },
};
