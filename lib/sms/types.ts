// The ONE interface every SMS provider must implement. The rest of the shop
// (order messages, later login codes) only talks to this, never to a specific provider.

export type SendInput = {
  to: string; // 09xxxxxxxxx
  text: string; // Persian text, already final
};

export type SendResult = { ok: true; reference?: string } | { ok: false; error: string };

export interface SmsProvider {
  id: string; // stored in sms_log.provider
  label: string;
  send(input: SendInput): Promise<SendResult>;
}
