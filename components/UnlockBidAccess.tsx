// src/components/BoldPaymentButton.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface BoldPaymentButtonProps {
  amount: number;
  description: string;
  type: "bid_access" | "contact_access";
  motorcycleId: string;
  onSuccess?: () => void;
  buttonText?: string;
}

declare global {
  interface Window {
    BoldPaymentButton?: any;
  }
}

export default function BoldPaymentButton({
  amount,
  description,
  type,
  motorcycleId,
  onSuccess,
  buttonText = "Pagar con Bold",
}: BoldPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    // Cargar el script de Bold
    const script = document.createElement("script");
    script.src = "https://checkout.bold.co/library/boldPaymentButton.js";
    script.async = true;
    script.onload = () => setIsLoading(false);
    document.head.appendChild(script);

    // Generar orderId único
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const newOrderId = `${type}-${motorcycleId}-${Date.now()}`;
      setOrderId(newOrderId);
      
      // Guardar referencia en la base de datos
      await supabase.from("unlock_payments").insert([
        {
          user_id: session?.user?.id,
          motorcycle_id: motorcycleId,
          payment_reference: newOrderId,
          type: type,
          amount: amount,
          status: "pending",
        },
      ]);
    };
    
    init();
  }, []);

  if (isLoading) {
    return (
      <button
        disabled
        className="w-full rounded-2xl bg-zinc-800 py-4 font-black text-zinc-500"
      >
        Cargando...
      </button>
    );
  }

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <script
            data-bold-button
            data-api-key="${process.env.NEXT_PUBLIC_BOLD_PUBLIC_KEY || "Ma_MBrH4u-o0kyzdO5DdfhcdJ7LTNKmww6jtmrBcxVc"}"
            data-amount="${amount}"
            data-currency="COP"
            data-order-id="${orderId}"
            data-description="${description}"
            data-redirection-url="${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?reference=${orderId}"
            data-render-mode="embedded"
            data-bold-button="dark-L"
          ></script>
        `,
      }}
    />
  );
}