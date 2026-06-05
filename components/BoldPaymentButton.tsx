"use client";

import { useEffect, useRef } from "react";

interface BoldPaymentButtonProps {
  orderId: string;
  amount: number;
  currency: string;
  hash: string;
  description: string;
  redirectUrl: string;
  visible?: boolean;
}

export default function BoldPaymentButton({
  orderId,
  amount,
  currency,
  hash,
  description,
  redirectUrl,
  visible = true,
}: BoldPaymentButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.setAttribute("data-bold-button", "dark-L");
    script.setAttribute("data-api-key", process.env.NEXT_PUBLIC_BOLD_PUBLIC_KEY || process.env.NEXT_PUBLIC_BOLD_API_KEY || "");
    script.setAttribute("data-amount", String(amount));
    script.setAttribute("data-currency", currency);
    script.setAttribute("data-order-id", orderId);
    script.setAttribute("data-integrity-signature", hash);
    script.setAttribute("data-description", description);
    script.setAttribute("data-redirection-url", redirectUrl);
    script.setAttribute("data-render-mode", "embedded");
    script.src = "https://checkout.bold.co/library/boldPaymentButton.js";

    container.appendChild(script);

    return () => {
      try {
        container.innerHTML = "";
      } catch (error) {
        console.error("Error cleaning Bold button container:", error);
      }
    };
  }, [orderId, amount, currency, hash, description, redirectUrl, visible]);

  return <div className="flex justify-center" ref={containerRef} />;
}
