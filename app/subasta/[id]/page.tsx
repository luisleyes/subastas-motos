"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BidSection from "@/components/BidSection";
import LiveBids from "@/components/LiveBids";
import BuyNow from "@/components/BuyNow";
import UnlockBidAccess from "@/components/UnlockBidAccess";
import { calculateBidIncrement } from "@/lib/bidIncrement";
import { formatPrice } from "@/lib/formatPrice";
import { formatPlate } from "@/lib/formatPlate";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Phone, MessageCircle, User, Lock } from "lucide-react";

export default function SubastaPage({ params }: { params: Promise<{ id: string }> }) {
  const [motorcycle, setMotorcycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState(0);
  const [activeViewers, setActiveViewers] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [endTime, setEndTime] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasBidAccess, setHasBidAccess] = useState(false);
  const [liveBidPrice, setLiveBidPrice] = useState<number | null>(null);

  // Generar ID de sesión único
  useEffect(() => {
    const id = localStorage.getItem("viewer_session_id");
    if (id) {
      setSessionId(id);
    } else {
      const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("viewer_session_id", newId);
      setSessionId(newId);
    }
  }, []);

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Verificar acceso a pujas (para mostrar placa completa)
  useEffect(() => {
    const checkBidAccess = async () => {
      if (!userId || !motorcycle?.id) return;
      const { data } = await supabase
        .from("bid_access")
        .select("*")
        .eq("user_id", userId)
        .eq("motorcycle_id", motorcycle.id)
        .eq("active", true)
        .single();
      setHasBidAccess(!!data);
    };
    if (motorcycle?.id) {
      checkBidAccess();
    }
  }, [userId, motorcycle?.id]);

  // Registrar espectador activo
  useEffect(() => {
    if (!motorcycle?.id || !sessionId) return;

    const registerViewer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("active_viewers").upsert({
        motorcycle_id: motorcycle.id,
        user_id: user?.id || null,
        session_id: sessionId,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: "session_id,motorcycle_id",
      });
    };

    registerViewer();
    
    // Actualizar cada 10 segundos (heartbeat)
    const interval = setInterval(registerViewer, 10000);
    
    return () => clearInterval(interval);
  }, [motorcycle?.id, sessionId]);

  // Obtener espectadores activos en tiempo real
  useEffect(() => {
    if (!motorcycle?.id) return;

    const fetchViewers = async () => {
      const { count } = await supabase
        .from("active_viewers")
        .select("*", { count: "exact", head: true })
        .eq("motorcycle_id", motorcycle.id)
        .gt("last_seen", new Date(Date.now() - 30000).toISOString());
      
      setActiveViewers(count || 0);
    };

    fetchViewers();
    
    // Actualizar cada 5 segundos
    const interval = setInterval(fetchViewers, 5000);
    
    // Escuchar cambios en tiempo real
    const channel = supabase
      .channel("active-viewers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_viewers",
          filter: `motorcycle_id=eq.${motorcycle.id}`,
        },
        () => {
          fetchViewers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [motorcycle?.id]);

  // Obtener datos de la moto y pujas
  useEffect(() => {
    const loadMotorcycle = async () => {
      const { id } = await params;
      
      const { data, error } = await supabase
        .from("motorcycles")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setMotorcycle(data);
      setEndTime(data.auction_end || null);
      
      // Obtener participantes (pujadores únicos)
      const { data: bids } = await supabase
        .from("bids")
        .select("bidder_name, amount")
        .eq("motorcycle_id", id)
        .order("amount", { ascending: false });

      const uniqueParticipants = new Set(bids?.map((b) => b.bidder_name) || [])
        .size;
      setParticipants(uniqueParticipants);

      if (bids && bids.length > 0) {
        setLiveBidPrice(bids[0].amount);
      }

      setLoading(false);
    };

    loadMotorcycle();
  }, [params]);

  // Actualizar el tiempo de finalización cuando cambie (por anti-sniper)
  useEffect(() => {
    if (!motorcycle?.id) return;

    const channel = supabase
      .channel("motorcycle-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "motorcycles",
          filter: `id=eq.${motorcycle.id}`,
        },
        (payload) => {
          if (payload.new.auction_end !== endTime) {
            setEndTime(payload.new.auction_end);
            setMotorcycle((prev: any) => ({ ...prev, auction_end: payload.new.auction_end }));
          }
          // También actualizar el status si cambió
          setMotorcycle((prev: any) => ({
            ...prev,
            ...payload.new,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [motorcycle?.id, endTime, motorcycle?.status]);

  useEffect(() => {
    if (!motorcycle?.id) return;

    const channel = supabase
      .channel(`subasta-bids-${motorcycle.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `motorcycle_id=eq.${motorcycle.id}`,
        },
        (payload) => {
          const amount = (payload.new as { amount?: number }).amount;
          if (amount != null) {
            setLiveBidPrice((prev) =>
              prev == null ? amount : Math.max(prev, amount)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [motorcycle?.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500"></div>
          <p className="mt-4 text-zinc-400">Cargando subasta...</p>
        </div>
      </main>
    );
  }

  if (!motorcycle) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Moto no encontrada
      </main>
    );
  }

  const minimumIncrement = calculateBidIncrement(participants);
  const timeLeft = endTime ? getTimeLeft(endTime) : null;
  const isClosingSoon = timeLeft && timeLeft <= 2 * 60 * 1000 && timeLeft > 0;
  const currentPrice =
    liveBidPrice ?? motorcycle.current_price ?? motorcycle.base_price;

  // Determinar si mostrar placa completa o ofuscada
  const showFullPlate = hasBidAccess;
  const displayPlate = showFullPlate ? motorcycle.plate : formatPlate(motorcycle.plate);

  return (
    <main className="min-h-screen bg-black px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 transition mb-8">
          ← Volver al inicio
        </Link>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Imagen */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={motorcycle.image_url}
              alt={`${motorcycle.brand} ${motorcycle.model}`}
              className="h-[500px] w-full rounded-3xl object-cover"
            />
          </motion.div>

          {/* Información */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-5xl font-black text-white">
                {motorcycle.brand} <span className="text-orange-500">{motorcycle.model}</span>
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex items-center gap-3">
                <span>📍</span> {motorcycle.city}
              </div>
              <div className="flex items-center gap-3">
                <span>📅</span> {motorcycle.year}
              </div>
              <div className="flex items-center gap-3">
                <span>🛣️</span> {motorcycle.mileage.toLocaleString()} km
              </div>
              <div className="flex items-center gap-3">
                <span>🪪</span> 
                {displayPlate}
                {!showFullPlate && (
                  <span className="text-xs text-zinc-500 ml-1">🔒</span>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-8 text-center">
              <p className="text-sm uppercase tracking-widest text-orange-400">Precio base</p>
              <p className="text-5xl font-black text-orange-500">
                ${motorcycle.base_price.toLocaleString()}
              </p>
            </div>

            {/* ⏰ Tiempo restante con alerta anti-sniper */}
            {endTime && motorcycle.status === "active" && (
              <div className={`rounded-2xl border p-4 text-center ${isClosingSoon ? 'border-red-500/50 bg-red-500/10' : 'border-orange-500/20 bg-orange-500/10'}`}>
                <p className="text-sm text-zinc-400">⏰ Tiempo restante</p>
                <p className={`text-2xl font-black ${isClosingSoon ? 'text-red-500' : 'text-orange-500'}`}>
                  {formatTimeString(endTime)}
                </p>
                {isClosingSoon && (
                  <p className="text-xs text-red-400 mt-1 animate-pulse">
                    ⚠️ ¡Últimos minutos! Cualquier puja extiende la subasta
                  </p>
                )}
              </div>
            )}

            {/* Estado de la subasta si no está activa */}
            {motorcycle.status !== "active" && (
              <div className={`rounded-2xl border p-4 text-center ${motorcycle.status === "sold" ? 'border-green-500/50 bg-green-500/10' : 'border-zinc-500/50 bg-zinc-500/10'}`}>
                <p className="text-sm text-zinc-400">Estado</p>
                <p className={`text-2xl font-black ${motorcycle.status === "sold" ? 'text-green-500' : 'text-zinc-400'}`}>
                  {motorcycle.status === "sold" ? "¡VENDIDA!" : "FINALIZADA"}
                </p>
                {motorcycle.status === "sold" && motorcycle.sold_price && (
                  <p className="text-sm text-green-400 mt-1">
                    Vendida por: {formatPrice(motorcycle.sold_price)}
                  </p>
                )}
              </div>
            )}

            {/* 🔥 INFO EN VIVO - PARTICIPANTES Y ESPECTADORES (solo si está activa) */}
            {motorcycle.status === "active" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                      <span className="text-sm text-zinc-400">Pujadores activos</span>
                    </div>
                    <p className="text-3xl font-black text-white">{participants}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-zinc-400">Viendo ahora</span>
                    </div>
                    <p className="text-3xl font-black text-white">{activeViewers}</p>
                  </div>
                </div>

                {/* Info de incremento */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Incremento mínimo:</span>
                    <span className="font-bold text-green-400">{formatPrice(minimumIncrement)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Descripción */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
              <h3 className="mb-4 text-2xl font-black text-white">Detalles</h3>
              <p className="leading-relaxed text-zinc-400">{motorcycle.description}</p>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <Link
                href="/"
                className="flex-1 rounded-3xl border border-zinc-700 py-5 text-center font-black text-white transition hover:border-orange-500 hover:text-orange-500"
              >
                Volver
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ============================================ */}
        {/* CÓMO FUNCIONA */}
        {/* ============================================ */}
        <div className="mt-12">
          <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
            <h3 className="text-2xl font-black text-white mb-6">
              ¿Cómo funciona?
            </h3>

            <div className="space-y-4 text-zinc-300">
              <div className="flex gap-3">
                <span className="font-black text-orange-500">1.</span>
                <p>
                  Participa en la subasta o utiliza la opción de compra inmediata.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="font-black text-orange-500">2.</span>
                <p>
                  Si ganas la subasta o realizas la compra inmediata,
                  obtendrás acceso exclusivo al contacto del vendedor.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="font-black text-orange-500">3.</span>
                <p>
                  Comprador y vendedor negocian directamente entre sí.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="font-black text-orange-500">4.</span>
                <p>
                  Subastas Motos no vende la motocicleta ni recibe el valor final
                  de la negociación.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-300">
                ⚠️ El pago realizado mediante Bold corresponde únicamente al
                desbloqueo del contacto del vendedor y al acceso exclusivo a la
                negociación directa.
              </p>
            </div>
          </div>
        </div>

        {/* Comprar ahora - solo si está activa y tiene precio de compra directa */}
        {motorcycle.status === "active" && motorcycle.buy_now_price && (
          <div className="mt-8">
            <BuyNow
              motorcycleId={motorcycle.id}
              buyNowPrice={motorcycle.buy_now_price}
              currentPrice={currentPrice}
              status={motorcycle.status}
              sellerId={motorcycle.user_id}
              userId={userId}
              auctionEnd={endTime}
              motorcycleTitle={`${motorcycle.brand} ${motorcycle.model}`}
            />
          </div>
        )}

        {/* 🔓 SECCIÓN DE DESBLOQUEO DE PARTICIPACIÓN */}
        <div className="mt-12">
          {userId ? (
            <UnlockBidAccess motorcycleId={motorcycle.id} userId={userId} />
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
              <p className="text-zinc-400">🔒 Inicia sesión para participar en esta subasta</p>
              <Link href="/login" className="mt-3 inline-block text-orange-500 hover:underline">
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>

        {/* Bid Section con initialEndTime para anti-sniper (solo si está activa) */}
        {motorcycle.status === "active" && (
          <div className="mt-12">
            <BidSection
              motorcycleId={motorcycle.id}
              basePrice={motorcycle.base_price}
              initialEndTime={endTime || undefined}
              sellerId={motorcycle.user_id}
            />
            <LiveBids motorcycleId={motorcycle.id} />
          </div>
        )}
      </div>
    </main>
  );
}

// Función auxiliar para obtener tiempo restante en milisegundos
function getTimeLeft(endTimeStr: string): number {
  const end = new Date(endTimeStr).getTime();
  const now = new Date().getTime();
  return end - now;
}

// Función auxiliar para formatear tiempo restante
function formatTimeString(endTimeStr: string): string {
  const end = new Date(endTimeStr).getTime();
  const now = new Date().getTime();
  const diff = end - now;
  
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