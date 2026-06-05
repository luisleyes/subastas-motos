// src/lib/bold.ts

export const BID_ACCESS_AMOUNT = 10000;
export const BUY_NOW_ACCESS_AMOUNT = 15000;

// Links de pago estático (Bold dashboard). Compra inmediata usa botón embebido con monto dinámico.
export const BOLD_PAYMENT_LINKS: Record<string, string> = {
  bid_access:
    process.env.BOLD_LINK_BID_ACCESS ||
    "https://checkout.bold.co/payment/LNK_JO7TXXV5UC",

  contact_access:
    process.env.BOLD_LINK_CONTACT_ACCESS || "",
};

export interface BoldPaymentRequest {
  amount: number;
  currency: string;
  reference: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  type: string;
}

export interface BoldPaymentResponse {
  approvalUrl: string;
}

export function getBoldPaymentLink(type: string): string {
  return (
    BOLD_PAYMENT_LINKS[type as keyof typeof BOLD_PAYMENT_LINKS] || ""
  );
}

export async function createBoldPayment(
  paymentData: BoldPaymentRequest
): Promise<BoldPaymentResponse> {
  const { type, reference, returnUrl } = paymentData;

  const baseUrl = getBoldPaymentLink(type);

  if (!baseUrl) {
    throw new Error(
      `No hay link de pago configurado para el tipo: ${type}`
    );
  }

  const url = new URL(baseUrl);

  url.searchParams.set("reference", reference);
  url.searchParams.set("return_url", returnUrl);

  return {
    approvalUrl: url.toString(),
  };
}