"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const reference = searchParams.get("reference");
  const orderId = searchParams.get("order-id");
  const boldOrderId = searchParams.get("bold-order-id");

  const status =
    searchParams.get("status") ||
    searchParams.get("transaction_status") ||
    searchParams.get("tx-status") ||
    searchParams.get("bold-tx-status");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        console.log("🔍 URL PARAMS", {
          reference,
          orderId,
          boldOrderId,
          status,
        });

        if (status !== "approved") {
          if (status) {
            setError(true);
          } else {
            setTimeout(() => {
              router.push("/");
            }, 3000);
          }

          setLoading(false);
          return;
        }

        const paymentReference =
          reference || orderId || boldOrderId;

        if (!paymentReference) {
          console.error("❌ No llegó referencia de pago");
          setError(true);
          setLoading(false);
          return;
        }

        console.log("🔍 Buscando pago:", paymentReference);

        const { data: payment, error: paymentError } =
          await supabase
            .from("unlock_payments")
            .select("*")
            .eq("payment_id", paymentReference)
            .single();

        console.log("PAYMENT:", payment);
        console.log("PAYMENT ERROR:", paymentError);

        if (paymentError || !payment) {
          console.error("❌ Pago no encontrado");
          setError(true);
          setLoading(false);
          return;
        }

        if (payment.status === "pending") {
          const { error: updateError } = await supabase
            .from("unlock_payments")
            .update({
              status: "completed",
            })
            .eq("id", payment.id);

          console.log("UPDATE ERROR:", updateError);

          if (updateError) {
            setError(true);
            setLoading(false);
            return;
          }

          if (payment.type === "bid_access") {
            const { error: accessError } = await supabase
              .from("bid_access")
              .upsert(
                {
                  user_id: payment.user_id,
                  motorcycle_id: payment.motorcycle_id,
                  active: true,
                  activated_at: new Date().toISOString(),
                },
                {
                  onConflict: "user_id,motorcycle_id",
                }
              );

            console.log("BID ACCESS ERROR:", accessError);

            if (accessError) {
              console.error(accessError);
            }
          }
        }

        setSuccess(true);
      } catch (err) {
        console.error("❌ ERROR:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [
    reference,
    orderId,
    boldOrderId,
    status,
    router,
  ]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="mt-4 text-zinc-400">
          Verificando tu pago...
        </p>
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
            No pudimos verificar tu pago.
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
          ¡Pago exitoso!
        </h1>

        <p className="mt-4 text-zinc-400">
          Tu acceso para pujar fue desbloqueado correctamente.
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