"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

type PaymentType = "bid_access" | "buy_now" | "contact_access" | string;

const MESSAGES: Record<string, { title: string; description: string }> = {
  bid_access: {
    title: "¡Acceso desbloqueado!",
    description:
      "Ya puedes pujar en esta subasta. Vuelve a la ficha de la moto.",
  },
  buy_now: {
    title: "¡Compra confirmada!",
    description:
      "La subasta se cerró y eres el comprador. Revisa la moto en tu perfil.",
  },
  contact_access: {
    title: "¡Contacto desbloqueado!",
    description: "Ya puedes ver los datos del vendedor en la subasta.",
  },
};

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("bid_access");
  const [motorcycleId, setMotorcycleId] = useState<string | null>(null);

  const reference = searchParams.get("reference");
  const orderId = searchParams.get("order-id");
  const boldOrderId = searchParams.get("bold-order-id");

  const txStatus =
    searchParams.get("status") ||
    searchParams.get("transaction_status") ||
    searchParams.get("tx-status") ||
    searchParams.get("bold-tx-status");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const paymentReference = reference || orderId || boldOrderId;

        if (!paymentReference) {
          setError(true);
          setLoading(false);
          return;
        }

        if (txStatus && txStatus !== "approved") {
          setError(true);
          setLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError(true);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/payments/fulfill", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reference: paymentReference }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        setPaymentType(data.type || "bid_access");
        setMotorcycleId(data.motorcycleId || null);
        setSuccess(true);
      } catch (err) {
        console.error("verify payment:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [reference, orderId, boldOrderId, txStatus]);

  const copy = MESSAGES[paymentType] || MESSAGES.bid_access;

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
            No pudimos confirmar tu pago. Si ya pagaste, espera unos minutos o
            contacta soporte con tu referencia.
          </p>
          {reference && (
            <p className="mt-2 font-mono text-sm text-zinc-500">
              Ref: {reference}
            </p>
          )}
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
        <h1 className="mt-6 text-4xl font-black text-white">{copy.title}</h1>
        <p className="mt-4 text-zinc-400">{copy.description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {motorcycleId && (
            <Link
              href={`/subasta/${motorcycleId}`}
              className="rounded-2xl bg-green-500 px-6 py-3 font-black text-black transition hover:bg-green-400"
            >
              Ver subasta
            </Link>
          )}
          <Link
            href="/"
            className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-black transition hover:bg-orange-400"
          >
            Inicio
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
