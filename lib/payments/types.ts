// The ONE interface every payment gateway must implement. The rest of the shop
// (checkout, callback, admin) only talks to this, never to a specific gateway.
//
// Money: amounts are Toman, whole numbers, same as everywhere in the shop.
// A provider whose gateway wants Rial multiplies by 10 INSIDE its own file.

export type StartInput = {
  orderCode: string; // MP-XXXXXXXX, show it to the customer on the gateway page if the gateway allows
  amount: number; // Toman
  mobile: string; // 09xxxxxxxxx
  description: string;
  callbackUrl: string; // where the gateway must send the customer back
};

export type StartResult = {
  reference: string; // the gateway's own id for this attempt (Zarinpal: Authority); unique per provider
  redirectUrl: string; // send the customer's browser here to pay
};

// What came back to our callback URL (query string and/or form body merged, values as strings).
export type CallbackData = Record<string, string>;

export type ParsedCallback = {
  reference: string | null; // null = request did not look like a gateway callback
  cancelled: boolean; // the customer pressed "cancel" on the gateway page
};

export type VerifyInput = {
  reference: string;
  amount: number; // Toman, taken from OUR database, never from the callback
  callback: CallbackData;
};

export type VerifyResult =
  | { ok: true; gatewayRef: string; cardMask?: string }
  | { ok: false; error: string };

export interface PaymentProvider {
  id: string; // stored in payments.provider, also used in the callback URL
  label: string; // shown to the customer, Persian
  start(input: StartInput): Promise<StartResult>;
  parseCallback(callback: CallbackData): ParsedCallback;
  // Ask the gateway "did this really get paid, and for this amount?". Must NOT trust `callback` alone.
  verify(input: VerifyInput): Promise<VerifyResult>;
}
