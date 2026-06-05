"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BID_ACCESS_AMOUNT } from "@/lib/bold";
import { Lock } from "lucide-react";
import BoldPaymentButton from "@/components/BoldPaymentButton";

interface UnlockContactProps {
  motorcycleId: string;
  userId?: string;
}

export default function UnlockContact({
  motorcycleId,
  userId,
}: UnlockContactProps) {
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

        const orderId = `contact-${motorcycleId}-${Date.now()}`;

        await supabase.from("unlock_payments").insert([
          {
            user_id: userId,
            motorcycle_id: motorcycleId,
            payment_id: orderId,
            type: "contact_access",
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
          description: "Desbloquear contacto del vendedor",
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
          ✅ Ya tienes acceso al contacto del vendedor
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-6">
      <div className="text-center">
        <Lock className="mx-auto h-8 w-8 text-orange-500" />

        <h3 className="mt-3 text-xl font-black text-white">
          Desbloquea el contacto del vendedor
        </h3>

        <p className="mt-3 text-zinc-300">
          Al pagar este acceso podrás ver el contacto directo del vendedor y
          continuar la negociación privada de la motocicleta.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <h4 className="font-bold text-white">¿Qué obtienes?</h4>

        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li>✓ Contacto directo del vendedor</li>
          <li>✓ Información de la oferta y negociación</li>
          <li>✓ Transparencia en el proceso de compra</li>
          <li>✓ Acceso exclusivo tras pago seguro</li>
        </ul>
      </div>

      <div className="mt-6 text-center">
        {buttonAttrs ? (
          <BoldPaymentButton
            orderId={buttonAttrs.orderId}
            amount={buttonAttrs.amount}
            currency={buttonAttrs.currency}
            hash={buttonAttrs.hash}
            description={buttonAttrs.description}
            redirectUrl={buttonAttrs.redirectUrl}
          />
        ) : (
          <p className="text-sm text-zinc-400">Preparando pago...</p>
        )}
      </div>
    </div>
  );
}
