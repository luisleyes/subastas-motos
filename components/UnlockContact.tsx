"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/formatPrice";
import { Lock, Unlock, Phone, MessageCircle } from "lucide-react";
import BoldCheckout from "./BoldCheckout";

interface UnlockContactProps {
  motorcycleId: string;
  userId?: string;
  sellerWhatsapp?: string;
  sellerPhone?: string;
  sellerName?: string;
}

export default function UnlockContact({ 
  motorcycleId, 
  userId, 
  sellerWhatsapp, 
  sellerPhone,
  sellerName 
}: UnlockContactProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data } = await supabase
        .from("unlock_payments")
        .select("*")
        .eq("user_id", userId)
        .eq("motorcycle_id", motorcycleId)
        .eq("type", "contact_access")
        .eq("status", "completed")
        .single();

      setHasAccess(!!data);
      setLoading(false);
    };

    if (userId) {
      checkAccess();
    } else {
      setLoading(false);
    }
  }, [userId, motorcycleId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
        <div className="animate-pulse text-zinc-500">Verificando acceso...</div>
      </div>
    );
  }

  if (hasAccess && sellerWhatsapp) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-black/50 p-4">
            <MessageCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm text-zinc-400">WhatsApp</p>
              <a
                href={`https://wa.me/${sellerWhatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold text-green-400 hover:underline"
              >
                {sellerWhatsapp}
              </a>
            </div>
          </div>
          
          {sellerPhone && (
            <div className="flex items-center gap-3 rounded-xl bg-black/50 p-4">
              <Phone className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-zinc-400">Teléfono</p>
                <p className="text-lg font-bold text-white">{sellerPhone}</p>
              </div>
            </div>
          )}
          
          {sellerName && (
            <p className="text-center text-sm text-zinc-500">
              Contacto: {sellerName}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6">
        <h3 className="text-center text-xl font-bold text-white mb-4">
          Desbloquear contacto del vendedor
        </h3>
        <p className="text-center text-sm text-zinc-400 mb-6">
          Por solo {formatPrice(20000)} podrás ver el WhatsApp y teléfono del vendedor
        </p>
        <BoldCheckout
          amount={20000}
          description={`Desbloquear contacto vendedor - Moto ${motorcycleId}`}
          motorcycleId={motorcycleId}
          type="contact_access"
          buttonText={`Pagar ${formatPrice(20000)} y desbloquear`}
          buttonClassName="w-full rounded-2xl bg-green-500 py-4 font-black text-black hover:bg-green-400 transition"
        />
        <button
          onClick={() => setShowPayment(false)}
          className="mt-3 w-full text-center text-sm text-zinc-500 hover:text-white transition"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6 text-center">
      <Lock className="mx-auto h-8 w-8 text-orange-500" />
      <p className="mt-2 font-bold text-orange-400">🔒 Contacto bloqueado</p>
      <p className="text-sm text-zinc-400 mb-4">
        Para ver el WhatsApp y teléfono del vendedor, desbloquea el acceso
      </p>
      <button
        onClick={() => setShowPayment(true)}
        className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-black transition hover:bg-orange-400"
      >
        Desbloquear contacto por {formatPrice(20000)}
      </button>
    </div>
  );
}