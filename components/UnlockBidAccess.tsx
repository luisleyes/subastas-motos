"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/formatPrice";
import { BID_ACCESS_AMOUNT } from "@/lib/bold";
import { Lock } from "lucide-react";
import BoldPaymentButton from "@/components/BoldPaymentButton";

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
  const [buttonAttrs, setButtonAttrs] = useState<null | {
    orderId: string;
    amount: number;
    currency: string;
    hash: string;
    redirectUrl: string;
    description: string;
  }>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        setLoading(true);

        const { data: existingAccess } = await supabase
          .from("bid_access")
          .select("id")
          .eq("user_id", userId)
          .eq("motorcycle_id", motorcycleId)
          .eq("active", true)
          .maybeSingle();

        if (existingAccess) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        const orderId = `bid-${motorcycleId}-${Date.now()}`;

        await supabase.from("unlock_payments").insert([
          {
            user_id: userId,
            motorcycle_id: motorcycleId,
            payment_id: orderId,
            type: "bid_access",
            amount: BID_ACCESS_AMOUNT,
            status: "pending",
          },
        ]);

        const hashResponse = await fetch("/api/bold/generate-hash", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            amount: BID_ACCESS_AMOUNT,
            currency: "COP",
          }),
        });

        const hashData = await hashResponse.json();

        if (!hashData?.hash) {
          console.error("No se pudo generar el hash");
          setLoading(false);
          return;
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

        setButtonAttrs({
          orderId,
          amount: BID_ACCESS_AMOUNT,
          currency: "COP",
          hash: hashData.hash,
          redirectUrl: `${baseUrl}/payment/success?reference=${orderId}&status=approved`,
          description: "Acceso para pujar en subasta",
        });
      } catch (error) {
        console.error("Error inicializando Bold:", error);
      } finally {
        setLoading(false);
      }
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
      <Lock className="mx-auto h-8 w-8 text-orange-500" />

      <p className="mt-3 text-lg font-bold text-orange-400">
        Desbloquear acceso
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        Paga {formatPrice(BID_ACCESS_AMOUNT)} para participar en esta subasta
      </p>

      {buttonAttrs && (
        <BoldPaymentButton
          orderId={buttonAttrs.orderId}
          amount={buttonAttrs.amount}
          currency={buttonAttrs.currency}
          hash={buttonAttrs.hash}
          description={buttonAttrs.description}
          redirectUrl={buttonAttrs.redirectUrl}
        />
      )}
    </div>
  );
} 