"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="text-center">
        <XCircle className="mx-auto h-20 w-20 text-red-500" />
        <h1 className="mt-6 text-4xl font-black text-white">Pago cancelado</h1>
        <p className="mt-4 text-zinc-400">
          No se ha realizado ningún cargo. Puedes intentar nuevamente cuando quieras.
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