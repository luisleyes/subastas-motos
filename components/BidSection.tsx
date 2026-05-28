"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateBidIncrement } from "@/lib/bidIncrement";
import { formatPrice } from "@/lib/formatPrice";
import { extendAuctionIfNeeded } from "@/lib/antiSniper";

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
  initialEndTime,
}: {
  motorcycleId: string;
  basePrice: number;
  initialEndTime?: string;
}) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [highestBid, setHighestBid] = useState(basePrice);
  const [endTime, setEndTime] = useState<Date | null>(
    initialEndTime ? new Date(initialEndTime) : null
  );

  // Calcular incremento mínimo dinámico
  const minimumIncrement = calculateBidIncrement(participants);
  const minimumAllowedBid = highestBid + minimumIncrement;

  // Cargar bids iniciales
  useEffect(() => {
    fetchBids();
    checkAccess();

    // Obtener el tiempo de finalización actual
    const fetchEndTime = async () => {
      const { data } = await supabase
        .from("motorcycles")
        .select("auction_end")
        .eq("id", motorcycleId)
        .single();
      if (data?.auction_end) {
        setEndTime(new Date(data.auction_end));
      }
    };
    fetchEndTime();

    const channel = supabase
      .channel("bids-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `motorcycle_id=eq.${motorcycleId}`,
        },
        (payload) => {
          const newBid = payload.new as Bid;
          setBids((prev) => [newBid, ...prev]);
          if (newBid.amount > highestBid) {
            setHighestBid(newBid.amount);
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
      .order("amount", { ascending: false });

    if (data) {
      setBids(data);
      const uniqueParticipants = new Set(data.map(b => b.bidder_name)).size;
      setParticipants(uniqueParticipants);
      if (data.length > 0) {
        setHighestBid(data[0].amount);
      }
    }
  }

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
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
  }

  async function placeBid() {
    // 🔒 PASO 4: Verificar que la subasta está activa (vendida o finalizada)
    const { data: motorcycle } = await supabase
      .from("motorcycles")
      .select("status")
      .eq("id", motorcycleId)
      .single();

    if (motorcycle?.status !== "active") {
      alert("⚠️ Esta subasta ya no está activa (vendida o finalizada)");
      return;
    }

    if (!name.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    const bidAmount = Number(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      alert("Ingresa un monto válido");
      return;
    }

    if (bidAmount < minimumAllowedBid) {
      alert(`⚠️ La puja mínima es ${formatPrice(minimumAllowedBid)}`);
      return;
    }

    setIsLoading(true);

    // 🔥 ANTI-SNIPER: Verificar si necesitamos extender la subasta
    let newEndTime = endTime;
    if (endTime) {
      const extendedEndTime = extendAuctionIfNeeded(endTime);
      if (extendedEndTime.getTime() !== endTime.getTime()) {
        newEndTime = extendedEndTime;
        // Actualizar en la base de datos
        await supabase
          .from("motorcycles")
          .update({ auction_end: extendedEndTime.toISOString() })
          .eq("id", motorcycleId);
        
        setEndTime(extendedEndTime);
        alert(`⏰ ¡Subasta extendida! Nueva fecha de cierre: ${extendedEndTime.toLocaleString()}`);
      }
    }

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
    } else {
      alert(`✅ Puja de ${formatPrice(bidAmount)} realizada con éxito!`);
      setAmount("");
      setHighestBid(bidAmount);
    }

    setIsLoading(false);
  }

  const currentPrice = highestBid;
  const timeLeftText = endTime ? formatTimeLeft(endTime) : "No definido";

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
          {formatPrice(currentPrice)}
        </h3>
      </div>

      {/* Tiempo restante */}
      {endTime && (
        <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
          <p className="text-sm text-zinc-400">⏰ Tiempo restante</p>
          <p className="text-2xl font-black text-orange-500">{timeLeftText}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {endTime.getTime() - new Date().getTime() <= 2 * 60 * 1000 && endTime.getTime() - new Date().getTime() > 0 ? 
              "⚠️ ¡Últimos minutos! Cualquier puja extiende la subasta" : ""}
          </p>
        </div>
      )}

      {/* Info de participantes e incremento */}
      <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-zinc-400">Participantes activos:</span>
            <span className="ml-2 font-bold text-white">{participants}</span>
          </div>
          <div>
            <span className="text-zinc-400">Incremento mínimo:</span>
            <span className="ml-2 font-bold text-green-400">{formatPrice(minimumIncrement)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-zinc-400">Puja mínima permitida:</span>
            <span className="ml-2 font-bold text-orange-500">{formatPrice(minimumAllowedBid)}</span>
          </div>
        </div>
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

      {/* Botón condicional */}
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
        <h3 className="text-xl font-bold text-white">Historial de pujas</h3>
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
                {formatPrice(bid.amount)}
              </p>
            </div>
          ))
        )}
      </div>

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

function formatTimeLeft(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return "Subasta finalizada";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (86400000)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (3600000)) / (1000 * 60));
  const seconds = Math.floor((diff % (60000)) / 1000);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}