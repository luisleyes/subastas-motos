// src/lib/bold.ts

// Links de pago generados desde el dashboard de Bold
export const BOLD_PAYMENT_LINKS = {
  bid_access: "https://checkout.bold.co/payment/LNK_JO7TXXV5UC",
  // contact_access: "https://checkout.bold.co/payment/LNK_XXXXXX", // Agrega cuando crees el link para $20.000
};

export interface BoldPaymentRequest {
  amount: number;
  currency: string;
  reference: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  type: string; // 'bid_access' o 'contact_access'
}

export interface BoldPaymentResponse {
  approvalUrl: string;
}

/**
 * Obtiene el link de pago según el tipo
 */
export function getBoldPaymentLink(type: string): string {
  return BOLD_PAYMENT_LINKS[type as keyof typeof BOLD_PAYMENT_LINKS] || "";
}

/**
 * Crea un pago generando la URL con parámetros de referencia
 */
export async function createBoldPayment(
  paymentData: BoldPaymentRequest
): Promise<BoldPaymentResponse> {
  const { type, reference, returnUrl } = paymentData;
  
  // Obtener el link base según el tipo
  const baseUrl = getBoldPaymentLink(type);
  
  if (!baseUrl) {
    throw new Error(`No hay link de pago configurado para el tipo: ${type}`);
  }
  
  // Agregar parámetros a la URL para identificar el pago en el webhook
  const url = new URL(baseUrl);
  url.searchParams.set("reference", reference);
  url.searchParams.set("return_url", returnUrl);
  
  return {
    approvalUrl: url.toString(),
  };
}