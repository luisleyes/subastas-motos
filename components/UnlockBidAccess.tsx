"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/formatPrice";
import { Lock } from "lucide-react";

interface UnlockBidAccessProps {
  motorcycleId: string;
  userId?: string;
}

export default function UnlockBidAccess({
  motorcycleId,
  userId,
}: UnlockBidAccessProps) {
  const pathname = usePathname();

  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buttonHtml, setButtonHtml] = useState("");

  useEffect(() => {
    const init = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // verificar acceso
      const { data } = await supabase
        .from("unlock_payments")
        .select("*")
        .eq("user_id", userId)
        .eq("motorcycle_id", motorcycleId)
        .eq("type", "bid_access")
        .eq("status", "completed")
        .single();

      setHasAccess(!!data);

      // generar order id único
      const orderId = `bid-${motorcycleId}-${Date.now()}`;

      // guardar pago pendiente
      await supabase.from("unlock_payments").insert([
        {
          user_id: userId,
          motorcycle_id: motorcycleId,
          payment_reference: orderId,
          type: "bid_access",
          amount: 10000,
          status: "pending",
        },
      ]);

      // crear HTML del botón
      setButtonHtml(`
        <script
          data-bold-button="dark-L"
          data-api-key="${process.env.NEXT_PUBLIC_BOLD_PUBLIC_KEY}"
          data-amount="10000"
          data-currency="COP"
          data-order-id="${orderId}"
          data-description="Acceso para pujar en subasta"
          data-redirection-url="http://localhost:3000/payment/success?reference=${orderId}"
          data-render-mode="embedded"
          src="https://checkout.bold.co/library/boldPaymentButton.js"
        ></script>
      `);

      setLoading(false);
    };

    init();
  }, [motorcycleId, userId, pathname]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  if (hasAccess) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <p className="font-bold text-green-400">
          ✅ Ya tienes acceso para pujar
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6 text-center">
      <Script
        src="https://checkout.bold.co/library/boldPaymentButton.js"
        strategy="afterInteractive"
      />

      <Lock className="mx-auto h-8 w-8 text-orange-500" />

      <p className="mt-3 text-lg font-bold text-orange-400">
        Desbloquear acceso
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        Paga {formatPrice(10000)} para participar en esta subasta
      </p>

      <div
        className="mt-6 flex justify-center"
        dangerouslySetInnerHTML={{
          __html: buttonHtml,
        }}
      />
    </div>
  );
}