"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/formatPrice";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, CheckCircle, Shield, CreditCard } from "lucide-react";
import BoldCheckout from "./BoldCheckout";

interface BuyNowProps {
  motorcycleId: string;
  buyNowPrice: number;
  currentPrice: number;
  status: string;
  sellerId?: string;
  motorcycleTitle?: string;
}

export default function BuyNow({ 
  motorcycleId, 
  buyNowPrice, 
  currentPrice, 
  status,
  sellerId,
  motorcycleTitle
}: BuyNowProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-green-400 flex items-center gap-1">
              <Zap className="h-4 w-4" />
              ¿No quieres esperar?
            </p>
            <h3 className="text-2xl font-bold text-white mt-1">
              Compra inmediata
            </h3>
            <p className="text-3xl font-extrabold text-green-400 mt-2">
              {formatPrice(buyNowPrice)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Precio actual de puja: {formatPrice(currentPrice)}
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
              <Shield className="h-3 w-3" />
              Pago 100% seguro con Bold
            </div>
          </div>
          
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <CreditCard className="h-5 w-5" />
            Comprar ahora
          </button>
        </div>
      </motion.div>

      {/* Modal de pago con Bold */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-white">Confirmar compra</h3>
              <p className="mt-2 text-zinc-400">
                Estás a punto de comprar esta moto por
              </p>
              <p className="text-3xl font-black text-green-500 mt-2">
                {formatPrice(buyNowPrice)}
              </p>
            </div>

            <div className="space-y-4">
              <BoldCheckout
                motorcycleId={motorcycleId}
                amount={buyNowPrice}
                description={`Compra de ${motorcycleTitle || "moto"} - ID: ${motorcycleId}`}
                onClose={() => setShowPaymentModal(false)}
              />
              
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full rounded-xl border border-zinc-700 py-3 font-medium text-white transition hover:bg-zinc-800"
              >
                Cancelar
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">
              Al continuar, aceptas los términos y condiciones de la plataforma.
              El pago es procesado de forma segura por Bold.
            </p>
          </motion.div>
        </div>
      )}
    </>
  );
}