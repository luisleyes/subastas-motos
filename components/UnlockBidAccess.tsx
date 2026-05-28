"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Lock } from "lucide-react";
import BoldCheckout from "./BoldCheckout";
import { formatPrice } from "@/lib/formatPrice";

interface UnlockBidAccessProps {
  motorcycleId: string;
  userId?: string;
}

export default function UnlockBidAccess({
  motorcycleId,
  userId,
}: UnlockBidAccessProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("unlock_payments")
        .select("*")
        .eq("user_id", userId)
        .eq("motorcycle_id", motorcycleId)
        .eq("type", "bid_access")
        .eq("status", "completed")
        .single();

      setHasAccess(!!data);
      setLoading(false);
    };

    checkAccess();
  }, [motorcycleId, userId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
        <p className="text-zinc-500">Verificando acceso...</p>
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
        Desbloquear acceso a la subasta
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        Para participar en esta subasta debes desbloquear el acceso.
      </p>

      <div className="mt-6">
        <BoldCheckout
          amount={10000}
          description={`Acceso a pujas - Moto ${motorcycleId}`}
          motorcycleId={motorcycleId}
          type="bid_access"
          buttonText={`Pagar ${formatPrice(10000)} y participar`}
        />
      </div>
    </div>
  );
}