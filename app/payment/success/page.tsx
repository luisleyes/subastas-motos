"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const reference = searchParams.get("reference");
  const boldOrderId = searchParams.get("bold-order-id");
  const txStatus = searchParams.get("bold-tx-status");

  useEffect(() => {
    const verifyPayment = async () => {
      if (txStatus === "approved") {
        // Buscar el pago pendiente
        const { data: payment } = await supabase
          .from("unlock_payments")
          .select("*")
          .eq("payment_reference", reference)
          .single();

        if (payment && payment.status === "pending") {
          // Actualizar estado
          await supabase
            .from("unlock_payments")
            .update({ status: "completed" })
            .eq("payment_reference", reference);

          // Si es bid_access, activar acceso
          if (payment.type === "bid_access") {
            await supabase.from("bid_access").upsert({
              user_id: payment.user_id,
              motorcycle_id: payment.motorcycle_id,
              active: true,
              activated_at: new Date().toISOString(),
            });
          }
          
          setSuccess(true);
        }
      }
      setLoading(false);
    };

    if (reference) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [reference, txStatus]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="mt-4 text-zinc-400">Verificando tu pago...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
        <h1 className="mt-6 text-4xl font-black text-white">
          {success ? "¡Pago exitoso!" : "Verificación completada"}
        </h1>
        <p className="mt-4 text-zinc-400">
          {success 
            ? "Tu acceso ha sido desbloqueado. Ya puedes participar en la subasta." 
            : "Gracias por tu compra"}
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-black transition hover:bg-orange-400"
          >
            Volver al inicio
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl border border-zinc-700 px-6 py-3 font-black text-white transition hover:border-orange-500 hover:text-orange-500"
          >
            Mi dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}