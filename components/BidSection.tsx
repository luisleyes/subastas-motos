"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Bid {
  id: string;
  bidder_name: string;
  amount: number;
  created_at: string;
  motorcycle_id?: string;
}

export default function BidSection({
  motorcycleId,
  basePrice,
}: {
  motorcycleId: string;
  basePrice: number;
}) {

  const [bids, setBids] = useState<Bid[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar bids iniciales y verificar acceso

  useEffect(() => {

    fetchBids();

    // 🔐 VERIFICAR ACCESO A PUJAS
    const checkAccess = async () => {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("bid_access")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
        .single();

      if (data) {
        setHasAccess(true);
      }
    };

    checkAccess();

    const channel = supabase
      .channel("bids-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
        },
        (payload) => {

          const newBid = payload.new as Bid;

          if (newBid.motorcycle_id === motorcycleId) {
            setBids((prev) => [
              newBid,
              ...prev,
            ]);
          }

        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [motorcycleId]);

  async function fetchBids() {

    const { data } = await supabase
      .from("bids")
      .select("*")
      .eq("motorcycle_id", motorcycleId)
      .order("amount", {
        ascending: false,
      });

    if (data) {
      setBids(data);
    }
  }

  async function placeBid() {

    // Validar nombre
    if (!name.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    const highestBid = bids[0]?.amount || basePrice;
    const bidAmount = Number(amount);

    if (bidAmount <= highestBid) {
      alert(`La puja debe ser mayor a $${highestBid.toLocaleString()}`);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from("bids")
      .insert([
        {
          motorcycle_id: motorcycleId,
          bidder_name: name,
          amount: bidAmount,
        },
      ]);

    if (error) {
      console.error("Error al pujar:", error);
      alert("❌ Error realizando puja");
      setIsLoading(false);
      return;
    }

    setAmount("");
    setIsLoading(false);
    alert(`✅ Puja de $${bidAmount.toLocaleString()} realizada con éxito!`);
  }

  const currentPrice = bids[0]?.amount || basePrice;

  return (
    <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-8">

      <h2 className="mb-6 text-3xl font-black text-white">
        Pujas en tiempo real
      </h2>

      {/* Precio actual */}
      <div className="mb-8">
        <p className="text-sm uppercase tracking-widest text-zinc-500">
          Puja actual
        </p>
        <h3 className="mt-2 text-5xl font-black text-orange-500">
          ${currentPrice.toLocaleString()}
        </h3>
      </div>

      {/* Inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          disabled={!hasAccess}
          className={`rounded-2xl border border-zinc-700 bg-black p-4 text-white ${!hasAccess ? 'cursor-not-allowed opacity-50' : ''}`}
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Monto de puja"
          type="number"
          disabled={!hasAccess}
          className={`rounded-2xl border border-zinc-700 bg-black p-4 text-white ${!hasAccess ? 'cursor-not-allowed opacity-50' : ''}`}
        />
      </div>

      {/* 🎯 BOTÓN CONDICIONAL */}
      {hasAccess ? (
        <button
          onClick={placeBid}
          disabled={isLoading}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 py-5 text-xl font-black text-black transition hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50"
        >
          {isLoading ? "Procesando..." : "🚀 PUJAR AHORA"}
        </button>
      ) : (
        <button
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-2xl bg-zinc-800 py-5 text-xl font-black text-zinc-500"
        >
          🔒 Debes desbloquear pujas
        </button>
      )}

      {/* Historial */}
      <div className="mt-10 space-y-4">
        {bids.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-black p-8 text-center">
            <p className="text-zinc-500">Aún no hay pujas. ¡Sé el primero!</p>
          </div>
        ) : (
          bids.map((bid) => (
            <div
              key={bid.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black p-4 transition hover:border-orange-500/30"
            >
              <div>
                <p className="font-bold text-white">{bid.bidder_name}</p>
                <p className="text-sm text-zinc-500">
                  {new Date(bid.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-2xl font-black text-orange-500">
                ${bid.amount.toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Mensaje informativo si no tiene acceso */}
      {!hasAccess && (
        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
          <p className="text-sm text-zinc-400">
            💡 Para participar en las pujas, debes desbloquear el acceso desde tu{" "}
            <a href="/dashboard" className="text-orange-500 hover:underline">
              Dashboard
            </a>
          </p>
        </div>
      )}
    </div>
  );
}