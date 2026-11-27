import type { PaymentMethod } from '../types';
import { PAYMENT_METHOD_LABELS } from '../labels';

/**
 * Payment gateway abstraction.
 *
 * No real payment provider is integrated yet. To add Razorpay later:
 *  1. Create an Edge Function that creates a Razorpay order server-side
 *     (the key secret must never ship in the app).
 *  2. Implement `PaymentProvider` with that function + the Razorpay checkout SDK.
 *  3. Register it in `getPaymentProvider()` and flip `enabled` for methods.
 *  4. Record results in the `payment_records` table via a verified webhook.
 */
export interface PaymentMethodOption {
  method: PaymentMethod;
  label: string;
  description: string;
  enabled: boolean;
  comingSoon: boolean;
}

export interface PaymentIntentResult {
  status: 'not_available' | 'requires_action' | 'succeeded' | 'failed';
  message: string;
}

export interface PaymentProvider {
  readonly name: string;
  listMethods(): PaymentMethodOption[];
  startPayment(input: { bookingReference: string; amount: number; method: PaymentMethod }): Promise<PaymentIntentResult>;
}

const DESCRIPTIONS: Record<PaymentMethod, string> = {
  upi: 'Google Pay, PhonePe, Paytm, BHIM',
  card: 'Visa, Mastercard, RuPay',
  netbanking: 'All major Indian banks',
  wallet: 'Paytm, Amazon Pay, Mobikwik',
  pay_at_operator: 'Pay the operator directly after they confirm',
};

class ComingSoonPaymentProvider implements PaymentProvider {
  readonly name = 'none';
  listMethods(): PaymentMethodOption[] {
    return (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => ({
      method,
      label: PAYMENT_METHOD_LABELS[method],
      description: DESCRIPTIONS[method],
      enabled: method === 'pay_at_operator',
      comingSoon: method !== 'pay_at_operator',
    }));
  }
  async startPayment(): Promise<PaymentIntentResult> {
    return {
      status: 'not_available',
      message: 'Online payments are coming soon. No money has been charged — the operator will contact you to arrange payment.',
    };
  }
}

let provider: PaymentProvider = new ComingSoonPaymentProvider();

export function getPaymentProvider(): PaymentProvider {
  return provider;
}

/** Swap in a real provider (e.g. Razorpay) at app start-up. */
export function registerPaymentProvider(p: PaymentProvider): void {
  provider = p;
}
