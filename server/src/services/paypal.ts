/**
 * PayPal payout service.
 * Replace mock with real PayPal Payouts API when credentials are available.
 * Docs: https://developer.paypal.com/docs/api/payments.payouts-batch/v1/
 */

export interface PayoutResult {
  success: boolean;
  batchId?: string;
  error?: string;
}

export async function initiatePaypalPayout(
  recipientEmail: string,
  amountEur: number,
  note: string
): Promise<PayoutResult> {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    // Mock payout in dev/demo mode
    console.log(
      `[PayPal MOCK] Payout of €${amountEur} to ${recipientEmail}: ${note}`
    );
    return { success: true, batchId: `mock-batch-${Date.now()}` };
  }

  // Real implementation would use the PayPal SDK here
  return { success: false, error: "PayPal integration not yet configured" };
}

export const PARTNER_REBATES = [
  { id: "buildpro", name: "BuildPro Tools", discount: "15% off all orders", minTokens: 5 },
  { id: "safesite", name: "SafeSite PPE", discount: "20% off safety equipment", minTokens: 3 },
  { id: "hubexo-pro", name: "Hubexo Pro Subscription", discount: "1 month free", minTokens: 10 },
  { id: "construct-academy", name: "Construct Academy", discount: "Free online course", minTokens: 4 },
];
