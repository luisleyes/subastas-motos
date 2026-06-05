"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/formatPrice";
import { motion } from "framer-motion";
import { Zap, CheckCircle, Shield, CreditCard, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { canUseBuyNow } from "@/lib/auction";
import { BUY_NOW_ACCESS_AMOUNT } from "@/lib/bold";
import Link from "next/link";
import BoldPaymentButton from "@/components/BoldPaymentButton";

interface BuyNowProps {
  motorcycleId: string;
  buyNowPrice: number;
  currentPrice: number;
  status: string;
  sellerId?: string;
  userId?: string | null;
  motorcycleTitle?: string;
  auctionEnd?: string | null;
}

export default function BuyNow({
  motorcycleId,
  buyNowPrice,
  currentPrice,
  status,
  sellerId,
  userId,
  motorcycleTitle,
  auctionEnd,
}: BuyNowProps) {
  const [buttonAttrs, setButtonAttrs] = useState<null | {
    orderId: string;
    amount: number;
    currency: string;
    hash: string;
    redirectUrl: string;
    description: string;
  }>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const motoForCheck = {
    id: motorcycleId,
    status,
    base_price: currentPrice,
    buy_now_price: buyNowPrice,
    auction_end: auctionEnd,
  };

  const buyNowAvailable = canUseBuyNow(motoForCheck, currentPrice);
  const isOwnListing = Boolean(userId && sellerId && userId === sellerId);

  // Inicializar el pago una sola vez cuando se monta el componente
  useEffect(() => {
    const init = async () => {
      try {
        if (!userId || !buyNowAvailable) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);

        // Verificar si ya tienen acceso
        const { data: existingAccess } = await supabase
          .from("unlock_payments")
          .select("id")
          .eq("user_id", userId)
          .eq("motorcycle_id", motorcycleId)
          .eq("type", "buy_now")
          .eq("status", "approved")
          .maybeSingle();

        if (existingAccess) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }

        const orderId = `buy-now-${motorcycleId}-${Date.now()}`;

        await supabase.from("unlock_payments").insert([
          {
            user_id: userId,
            motorcycle_id: motorcycleId,
            payment_id: orderId,
            type: "buy_now",
            amount: BUY_NOW_ACCESS_AMOUNT,
            status: "pending",
          },
        ]);

        const hashResponse = await fetch("/api/bold/generate-hash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: BUY_NOW_ACCESS_AMOUNT,
            currency: "COP",
          }),
        });

        const hashData = await hashResponse.json();

        if (!hashData?.hash) {
          console.error("No se pudo generar el hash");
          setIsLoading(false);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

        setButtonAttrs({
          orderId,
          amount: BUY_NOW_ACCESS_AMOUNT,
          currency: "COP",
          hash: hashData.hash,
          redirectUrl: `${baseUrl}/payment/success?reference=${orderId}&status=approved`,
          description: "Compra inmediata",
        });
      } catch (error) {
        console.error("Error inicializando Bold BuyNow:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [motorcycleId, userId, buyNowAvailable]);


  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  if (hasAccess) {
    return (
      <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <p className="font-bold text-green-400">
          ✅ ¡Acceso confirmado! La subasta está cerrada.
        </p>
      </div>
    );
  }

  if (status !== "active") {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-3 text-xl font-bold text-white">
          {status === "sold" ? "¡Moto vendida!" : "Subasta finalizada"}
        </h3>
        <p className="mt-2 text-zinc-400">
          {status === "sold"
            ? "Esta moto ya fue vendida. Explora otras subastas."
            : "Esta subasta ha terminado. Revisa otras opciones."}
        </p>
      </div>
    );
  }

  if (!buyNowAvailable) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-700 bg-zinc-950 p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-zinc-500" />
        <p className="mt-3 text-zinc-400">
          La compra inmediata no está disponible: las pujas superaron el precio
          fijo o la subasta terminó.
        </p>
      </div>
    );
  }

  if (isOwnListing) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-700 bg-zinc-950 p-6 text-center">
        <p className="text-zinc-400">
          Eres el vendedor de esta moto. No puedes usar compra inmediata.
        </p>
      </div>
    );
  }

  if (!userId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6"
      >
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div>
            <p className="flex items-center justify-center gap-1 text-sm text-green-400">
              <Zap className="h-4 w-4" />
              ¿No quieres esperar?
            </p>
            <h3 className="mt-1 text-2xl font-bold text-white">
              Compra inmediata
            </h3>
            <p className="mt-2 text-3xl font-extrabold text-green-400">
              {formatPrice(buyNowPrice)}
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-green-500 px-8 py-4 font-bold text-black transition hover:bg-green-400"
          >
            Iniciar sesión para comprar
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6">
      <div className="text-center">
        <p className="flex items-center justify-center gap-1 text-sm text-green-400">
          <Zap className="h-4 w-4" />
          ¿No quieres esperar?
        </p>
        <h3 className="mt-1 text-2xl font-bold text-white">
          Compra inmediata
        </h3>
        <p className="mt-2 text-3xl font-extrabold text-green-400">
          {formatPrice(buyNowPrice)}
        </p>

        <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-sm text-green-300">
            ✓ La subasta se cerrará inmediatamente
          </p>
          <p className="mt-1 text-sm text-green-300">
            ✓ Obtendrás acceso exclusivo al contacto del vendedor
          </p>
          <p className="mt-1 text-sm text-green-300">
            ✓ Podrás negociar directamente con el propietario
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-xs text-yellow-300">
            Importante: pagas {formatPrice(BUY_NOW_ACCESS_AMOUNT)} para cerrar la subasta y obtener contacto.
            La negociación final se hace directo con el vendedor.
          </p>
        </div>
      </div>

      <div className="mt-6">
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
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
        <Shield className="h-3 w-3" />
        Pago seguro con Bold
      </div>
    </div>
  );
}