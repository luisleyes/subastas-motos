"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateBidIncrement } from "@/lib/bidIncrement";
import { formatPrice } from "@/lib/formatPrice";

interface Bid {
  id: string;
  user_id: string;
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
  const [amount, setAmount] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [highestBid, setHighestBid] = useState(basePrice);
  const [userId, setUserId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [endTime, setEndTime] = useState<Date | null>(
    initialEndTime ? new Date(initialEndTime) : null
  );
  const [timeLeftText, setTimeLeftText] = useState("");

  // Calcular incremento mínimo dinámico
  const minimumIncrement = calculateBidIncrement(participants);
  const minimumAllowedBid = highestBid + minimumIncrement;

  // 🔄 Timer en tiempo real
  useEffect(() => {
    if (!endTime) return;
    
    const updateTimeLeft = () => {
      setTimeLeftText(formatTimeLeft(endTime));
    };
    
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [endTime]);

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // 🟡 Mejor generación de nombre mostrado
        const displayName = 
          user.user_metadata?.username ||
          user.email?.split("@")[0] ||
          user.id.slice(0, 8);
        setUserDisplayName(displayName);
      }
    };
    getUser();
  }, []);

  // 🔴 CRÍTICO #1: checkAccess se ejecuta cuando llega userId
  useEffect(() => {
    if (userId) {
      checkAccess();
    }
  }, [userId, motorcycleId]);

  // Cargar bids iniciales (sin checkAccess aquí)
  useEffect(() => {
    if (!motorcycleId) return;
    
    fetchBids();

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

    // 🔴 CRÍTICO #2 y #3: Realtime corregido
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
          
          // Actualizar bids y participantes atómicamente
          setBids((prev) => {
            const updated = [newBid, ...prev];
            
            // Recalcular participantes únicos
            const uniqueParticipants = new Set(
              updated.map(b => b.user_id).filter(Boolean)
            ).size;
            setParticipants(uniqueParticipants);
            
            return updated;
          });
          
          // 🔴 CRÍTICO #2: Actualizar highestBid correctamente
          setHighestBid((prev) => Math.max(prev, newBid.amount));
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
      const uniqueParticipants = new Set(data.map(b => b.user_id).filter(Boolean)).size;
      setParticipants(uniqueParticipants);
      if (data.length > 0) {
        setHighestBid(data[0].amount);
      }
    }
  }

  async function checkAccess() {
    if (!userId) return;

    const { data } = await supabase
      .from("bid_access")
      .select("*")
      .eq("user_id", userId)
      .eq("motorcycle_id", motorcycleId)
      .eq("active", true)
      .single();

    setHasAccess(!!data);
  }

  // 🟡 Función para ofuscar nombre (opcional)
  function obfuscateName(name: string): string {
    if (name.length <= 6) {
      return name.substring(0, 3) + "***";
    }
    return name.substring(0, 4) + "***" + name.substring(name.length - 2);
  }

  async function placeBid() {
    if (!userId) {
      alert("Debes iniciar sesión para pujar");
      return;
    }

    // Verificar que la subasta está activa
    const { data: motorcycle } = await supabase
      .from("motorcycles")
      .select("status")
      .eq("id", motorcycleId)
      .single();

    if (motorcycle?.status !== "active") {
      alert("⚠️ Esta subasta ya no está activa (vendida o finalizada)");
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

    try {
      // Anti-sniper con RPC
      const { data: extendedEndTime, error: extendError } = await supabase
        .rpc('extend_auction_if_needed', {
          p_motorcycle_id: motorcycleId
        });

      if (extendError) {
        console.error("Error extendiendo subasta:", extendError);
      } else if (extendedEndTime && new Date(extendedEndTime) > (endTime || new Date())) {
        setEndTime(new Date(extendedEndTime));
        alert(`⏰ ¡Subasta extendida! Nueva fecha de cierre: ${new Date(extendedEndTime).toLocaleString()}`);
      }

      // Insertar puja
      const { error } = await supabase
        .from("bids")
        .insert([
          {
            motorcycle_id: motorcycleId,
            user_id: userId,
            bidder_name: userDisplayName,
            amount: bidAmount,
          },
        ]);

      if (error) {
        console.error("Error al pujar:", error);
        alert("❌ Error realizando puja");
      } else {
        alert(`✅ Puja de ${formatPrice(bidAmount)} realizada con éxito!`);
        setAmount("");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al procesar la puja");
    } finally {
      setIsLoading(false);
    }
  }

  const currentPrice = highestBid;

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

      {/* Tiempo restante con timer real */}
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
      <div className="grid gap-4 md:grid-cols-1">
        <div className="rounded-2xl border border-zinc-700 bg-black p-4 text-white">
          <p className="text-sm text-zinc-400">Pujando como:</p>
          <p className="font-bold text-orange-500">{userDisplayName || "Cargando..."}</p>
        </div>
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

      {/* Historial con nombres ofuscados (opcional) */}
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
                <p className="font-bold text-white">
                  {obfuscateName(bid.bidder_name)}
                </p>
                <p className="text-xs text-zinc-500">
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