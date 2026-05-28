"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  // Obtener parámetros de Bold
  const reference = searchParams.get("reference");
  const orderId = searchParams.get("order-id");

  // Bold puede devolver distintos nombres
  const status =
    searchParams.get("status") ||
    searchParams.get("transaction_status") ||
    searchParams.get("tx-status");

  const boldOrderId = searchParams.get("bold-order-id");

  useEffect(() => {
    const verifyPayment = async () => {
      console.log("🔍 Verificando pago:", {
        reference,
        orderId,
        status,
        boldOrderId,
      });

      try {
        // Pago aprobado
        if (status === "approved") {
          let payment = null;

          // Buscar por reference
          if (reference) {
            const { data } = await supabase
              .from("unlock_payments")
              .select("*")
              .eq("payment_reference", reference)
              .single();

            payment = data;
          }

          // Buscar por order-id
          if (!payment && orderId) {
            const { data } = await supabase
              .from("unlock_payments")
              .select("*")
              .eq("payment_reference", orderId)
              .single();

            payment = data;
          }

          if (payment) {
            // Actualizar estado
            if (payment.status === "pending") {
              await supabase
                .from("unlock_payments")
                .update({
                  status: "completed",
                })
                .eq("id", payment.id);

              // Activar acceso a puja
              if (payment.type === "bid_access") {
                await supabase.from("bid_access").upsert({
                  user_id: payment.user_id,
                  motorcycle_id: payment.motorcycle_id,
                  active: true,
                  activated_at: new Date().toISOString(),
                });
              }
            }

            setSuccess(true);
          } else {
            // Bold aprobó pero no encontramos registro
            setSuccess(true);
          }
        } else if (status && status !== "approved") {
          setError(true);
        } else {
          // Sin estado
          setTimeout(() => {
            router.push("/");
          }, 3000);
        }
      } catch (err) {
        console.error("Error verificando pago:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [reference, orderId, status, boldOrderId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="mt-4 text-zinc-400">Verificando tu pago...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
        <div className="text-center">
          <XCircle className="mx-auto h-20 w-20 text-red-500" />

          <h1 className="mt-6 text-4xl font-black text-white">
            Pago no completado
          </h1>

          <p className="mt-4 text-zinc-400">
            Tu pago no pudo ser procesado. Intenta nuevamente.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-black transition hover:bg-orange-400"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500" />

        <h1 className="mt-6 text-4xl font-black text-white">
          {success ? "¡Pago exitoso!" : "Gracias por tu compra"}
        </h1>

        <p className="mt-4 text-zinc-400">
          {success
            ? "Tu acceso ha sido desbloqueado. Ya puedes participar en la subasta."
            : "Tu pago está siendo procesado. En breve recibirás confirmación."}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
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

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          <p className="mt-4 text-zinc-400">Cargando...</p>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}