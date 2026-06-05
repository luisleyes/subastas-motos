"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateBidIncrement } from "@/lib/bidIncrement";
import { formatPrice } from "@/lib/formatPrice";
import { getMinimumAllowedBid, isAuctionExpired } from "@/lib/auction";
import { toast } from "sonner";

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
  sellerId,
}: {
  motorcycleId: string;
  basePrice: number;
  initialEndTime?: string;
  sellerId?: string | null;
}) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [amount, setAmount] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [endTime, setEndTime] = useState<Date | null>(
    initialEndTime ? new Date(initialEndTime) : null
  );
  const [timeLeftText, setTimeLeftText] = useState("");
  const [auctionClosed, setAuctionClosed] = useState(false);

  const minimumIncrement = calculateBidIncrement(participants);
  const minimumAllowedBid = getMinimumAllowedBid(basePrice, bids);
  const currentPrice =
    bids.length > 0 ? Math.max(...bids.map((b) => b.amount)) : basePrice;
  const isOwnListing = Boolean(userId && sellerId && userId === sellerId);

  useEffect(() => {
    if (!endTime) return;
    const updateTimeLeft = () => {
      setTimeLeftText(formatTimeLeft(endTime));
      if (isAuctionExpired(endTime.toISOString())) {
        setAuctionClosed(true);
      }
    };
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const displayName =
          user.user_metadata?.username ||
          user.email?.split("@")[0] ||
          user.id.slice(0, 8);
        setUserDisplayName(displayName);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) checkAccess();
  }, [userId, motorcycleId]);

  useEffect(() => {
    if (!motorcycleId) return;

    fetchBids();

    const fetchEndTime = async () => {
      const { data } = await supabase
        .from("motorcycles")
        .select("auction_end, status")
        .eq("id", motorcycleId)
        .single();
      if (data?.auction_end) setEndTime(new Date(data.auction_end));
      if (data?.status && data.status !== "active") {
        setAuctionClosed(true);
      }
    };
    fetchEndTime();

    const channel = supabase
      .channel(`bids-${motorcycleId}`)
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
          setBids((prev) => {
            const updated = [newBid, ...prev].sort(
              (a, b) => b.amount - a.amount
            );
            const uniqueParticipants = new Set(
              updated.map((b) => b.user_id).filter(Boolean)
            ).size;
            setParticipants(uniqueParticipants);
            return updated;
          });
          if (newBid.user_id !== userId) {
            toast.info(`Nueva puja: ${formatPrice(newBid.amount)}`, {
              description: `${obfuscateName(newBid.bidder_name)} acaba de pujar`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "motorcycles",
          filter: `id=eq.${motorcycleId}`,
        },
        (payload) => {
          const row = payload.new as { status?: string; auction_end?: string };
          if (row.auction_end) setEndTime(new Date(row.auction_end));
          if (row.status && row.status !== "active") {
            setAuctionClosed(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [motorcycleId, userId]);

  async function fetchBids() {
    const { data } = await supabase
      .from("bids")
      .select("*")
      .eq("motorcycle_id", motorcycleId)
      .order("amount", { ascending: false });

    if (data) {
      setBids(data);
      const uniqueParticipants = new Set(
        data.map((b) => b.user_id).filter(Boolean)
      ).size;
      setParticipants(uniqueParticipants);
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
      .maybeSingle();
    setHasAccess(!!data);
  }

  function obfuscateName(name: string): string {
    if (name.length <= 6) return name.substring(0, 3) + "***";
    return name.substring(0, 4) + "***" + name.substring(name.length - 2);
  }

  async function placeBid() {
    if (!userId) {
      toast.error("Debes iniciar sesión para pujar");
      return;
    }

    if (isOwnListing) {
      toast.error("No puedes pujar en tu propia moto");
      return;
    }

    if (!hasAccess) {
      toast.error("Desbloquea el acceso para pujar en esta subasta");
      return;
    }

    if (auctionClosed || (endTime && isAuctionExpired(endTime.toISOString()))) {
      toast.warning("Esta subasta ya finalizó");
      return;
    }

    const bidAmount = Number(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (bidAmount < minimumAllowedBid) {
      toast.error(`La puja mínima es ${formatPrice(minimumAllowedBid)}`);
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Sesión expirada. Vuelve a iniciar sesión.");
        return;
      }

      const response = await fetch("/api/bids/place", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          motorcycleId,
          amount: bidAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al realizar la puja");
        return;
      }

      if (data.auction_end) {
        const extended = new Date(data.auction_end);
        if (endTime && extended > endTime) {
          setEndTime(extended);
          toast.info("⏰ Subasta extendida", {
            description: `Nuevo cierre: ${extended.toLocaleString("es-CO")}`,
            duration: 6000,
          });
        } else if (!endTime) {
          setEndTime(extended);
        }
      }

      toast.success(`¡Puja de ${formatPrice(bidAmount)} realizada!`, {
        description: "Eres el mejor postor por ahora 🏆",
      });
      setAmount("");
      await fetchBids();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error inesperado", {
        description: "Por favor intenta de nuevo",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isClosingSoon =
    endTime &&
    endTime.getTime() - Date.now() <= 2 * 60 * 1000 &&
    endTime.getTime() - Date.now() > 0;

  const biddingDisabled =
    auctionClosed || isOwnListing || !hasAccess;

  return (
    <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
      <h2 className="mb-6 text-3xl font-black text-white">
        Pujas en tiempo real
      </h2>

      {auctionClosed && (
        <div className="mb-6 rounded-2xl border border-zinc-600 bg-zinc-900 p-4 text-center">
          <p className="font-bold text-zinc-300">Subasta cerrada</p>
          <p className="mt-1 text-sm text-zinc-500">
            Ya no se aceptan más pujas en esta moto.
          </p>
        </div>
      )}

      <div className="mb-8">
        <p className="text-sm uppercase tracking-widest text-zinc-500">
          {bids.length > 0 ? "Puja actual" : "Precio base (sin pujas aún)"}
        </p>
        <h3 className="mt-2 text-5xl font-black text-orange-500">
          {formatPrice(currentPrice)}
        </h3>
      </div>

      {endTime && !auctionClosed && (
        <div
          className={`mb-6 rounded-2xl border p-4 text-center transition-colors ${
            isClosingSoon
              ? "border-red-500/50 bg-red-500/10"
              : "border-orange-500/20 bg-orange-500/5"
          }`}
        >
          <p className="text-sm text-zinc-400">⏰ Tiempo restante</p>
          <p
            className={`text-2xl font-black ${
              isClosingSoon ? "animate-pulse text-red-500" : "text-orange-500"
            }`}
          >
            {timeLeftText}
          </p>
          {isClosingSoon && (
            <p className="mt-1 text-xs text-red-400">
              ¡Últimos minutos! Cualquier puja extiende la subasta
            </p>
          )}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-zinc-400">Participantes:</span>
            <span className="ml-2 font-bold text-white">{participants}</span>
          </div>
          <div>
            <span className="text-zinc-400">Incremento mínimo:</span>
            <span className="ml-2 font-bold text-green-400">
              {formatPrice(minimumIncrement)}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-zinc-400">Puja mínima permitida:</span>
            <span className="ml-2 font-bold text-orange-500">
              {formatPrice(minimumAllowedBid)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl border border-zinc-700 bg-black p-4 text-white">
          <p className="text-sm text-zinc-400">Pujando como:</p>
          <p className="font-bold text-orange-500">
            {userDisplayName || "Invitado"}
          </p>
        </div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Mínimo: ${formatPrice(minimumAllowedBid)}`}
          type="number"
          disabled={biddingDisabled}
          className={`rounded-2xl border border-zinc-700 bg-black p-4 text-white placeholder:text-zinc-600 ${
            biddingDisabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        />
      </div>

      {isOwnListing ? (
        <p className="mt-4 text-center text-sm text-zinc-500">
          Eres el vendedor de esta publicación.
        </p>
      ) : hasAccess && !auctionClosed ? (
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
          {auctionClosed
            ? "Subasta cerrada"
            : "🔒 Desbloquea pujas para participar"}
        </button>
      )}

      <div className="mt-10 space-y-4">
        <h3 className="text-xl font-bold text-white">Historial de pujas</h3>
        {bids.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-black p-8 text-center">
            <p className="text-zinc-500">Aún no hay pujas. ¡Sé el primero!</p>
          </div>
        ) : (
          bids.map((bid, index) => (
            <div
              key={bid.id}
              className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                index === 0
                  ? "border-orange-500/40 bg-orange-500/5"
                  : "border-zinc-800 bg-black hover:border-orange-500/30"
              }`}
            >
              <div>
                {index === 0 && (
                  <span className="mb-1 inline-block rounded-full bg-orange-500 px-2 py-0.5 text-xs font-black text-black">
                    🏆 Mejor puja
                  </span>
                )}
                <p className="font-bold text-white">
                  {obfuscateName(bid.bidder_name)}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(bid.created_at).toLocaleString("es-CO")}
                </p>
              </div>
              <p className="text-2xl font-black text-orange-500">
                {formatPrice(bid.amount)}
              </p>
            </div>
          ))
        )}
      </div>

      {!hasAccess && !auctionClosed && !isOwnListing && (
        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
          <p className="text-sm text-zinc-400">
            💡 Desbloquea el acceso con Bold en la sección de arriba para pujar.
          </p>
        </div>
      )}
    </div>
  );
}

function formatTimeLeft(endDate: Date): string {
  const diff = endDate.getTime() - Date.now();
  if (diff <= 0) return "Subasta finalizada";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
