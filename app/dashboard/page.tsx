"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Gavel,
  Trash2,
  Eye,
  Plus,
  Bike,
  Lock,
  Unlock,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [motorcycles, setMotorcycles] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [user, setUser] = useState<any>(null);
  
  // 🔥 ESTADOS PARA EDITAR - CRUCIALES
  const [editingMoto, setEditingMoto] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  // Estado para desbloquear pujas
  const [hasBidAccess, setHasBidAccess] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);
    setUserEmail(user.email || "");

    // Verificar acceso a pujas
    const { data: access } = await supabase
      .from("bid_access")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .single();

    if (access) {
      setHasBidAccess(true);
    }

    // Obtener SOLO las motos del usuario actual
    const { data, error } = await supabase
      .from("motorcycles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMotorcycles(data);
    }

    setLoading(false);
  };

  // Eliminar moto
  const deleteMotorcycle = async (id: string) => {
    const confirmDelete = confirm("¿Seguro que deseas eliminar esta publicación?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("motorcycles").delete().eq("id", id);

    if (error) {
      alert("Error eliminando publicación");
      return;
    }

    setMotorcycles(motorcycles.filter((moto) => moto.id !== id));
  };

  // 🔥 FUNCIÓN PARA ACTUALIZAR (EDITAR)
  const updateMotorcycle = async (id: string) => {
    const updates: any = {};
    if (editPrice) updates.base_price = parseInt(editPrice);
    if (editDescription) updates.description = editDescription;

    const { error } = await supabase.from("motorcycles").update(updates).eq("id", id);

    if (error) {
      alert("Error al actualizar: " + error.message);
      return;
    }

    // Actualizar estado local
    setMotorcycles(
      motorcycles.map((m) =>
        m.id === id
          ? {
              ...m,
              base_price: editPrice ? parseInt(editPrice) : m.base_price,
              description: editDescription || m.description,
            }
          : m
      )
    );
    
    // Cerrar formulario de edición
    setEditingMoto(null);
    setEditPrice("");
    setEditDescription("");
    alert("✅ Moto actualizada correctamente");
  };

  const getStatusBadge = (moto: any) => {
    if (moto.approved) {
      return (
        <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
          <CheckCircle className="h-3 w-3" /> Aprobada
        </span>
      );
    }
    if (moto.rejected) {
      return (
        <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">
          <XCircle className="h-3 w-3" /> Rechazada
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400">
        <Clock className="h-3 w-3" /> Pendiente
      </span>
    );
  };

  const unlockBidAccess = async () => {
    setIsUnlocking(true);
    try {
      const { data: existingAccess } = await supabase
        .from("bid_access")
        .select("*")
        .eq("user_id", user?.id)
        .eq("active", true)
        .single();

      if (existingAccess) {
        alert("✅ Ya tienes acceso a las pujas");
        setHasBidAccess(true);
        return;
      }

      const { error } = await supabase.from("bid_access").insert([
        {
          user_id: user?.id,
          active: true,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setHasBidAccess(true);
      alert("🎉 ¡Pujas desbloqueadas exitosamente!");
    } catch (error) {
      console.error(error);
      alert("❌ Error al desbloquear las pujas");
    } finally {
      setIsUnlocking(false);
    }
  };

  const totalMotos = motorcycles.length;
  const totalValor = motorcycles.reduce((acc, moto) => acc + moto.base_price, 0);
  const approvedMotos = motorcycles.filter((m) => m.approved).length;
  const pendingMotos = motorcycles.filter((m) => !m.approved && !m.rejected).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-widest text-orange-500">Dashboard</p>
            <h1 className="mt-2 text-5xl font-black">Bienvenido</h1>
            <p className="mt-3 text-zinc-400">{userEmail}</p>
          </div>
          <Link
            href="/publicar"
            className="rounded-2xl bg-orange-500 px-6 py-4 font-black text-black transition hover:bg-orange-400"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Publicar Moto
            </span>
          </Link>
        </div>

        {/* SECCIÓN DE DESBLOQUEO */}
        <div className="mt-6 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-6">
          {hasBidAccess ? (
            <div>
              <p className="text-2xl font-black text-green-400">✅ Pujas desbloqueadas</p>
              <p className="mt-2 text-zinc-400">Ya puedes participar en subastas.</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-black text-orange-500">🔥 Desbloquea las pujas</p>
                <p className="mt-2 text-zinc-400">Activa tu cuenta para pujar en motos reales.</p>
              </div>
              <button
                onClick={unlockBidAccess}
                disabled={isUnlocking}
                className="rounded-2xl bg-orange-500 px-8 py-4 font-black text-black transition hover:bg-orange-400 disabled:opacity-50"
              >
                {isUnlocking ? "Desbloqueando..." : "Desbloquear por 10.000 COP"}
              </button>
            </div>
          )}
        </div>

        {/* STATS */}
        <div className="mb-12 mt-12 grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="flex items-center gap-3">
              <Bike className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-zinc-400">Motos publicadas</p>
                <h2 className="text-4xl font-black">{totalMotos}</h2>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="flex items-center gap-3">
              <Gavel className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-zinc-400">Valor publicado</p>
                <h2 className="text-3xl font-black text-orange-500">
                  ${totalValor.toLocaleString()}
                </h2>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-zinc-400">Aprobadas</p>
                <h2 className="text-4xl font-black text-green-500">{approvedMotos}</h2>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-zinc-400">Pendientes</p>
                <h2 className="text-4xl font-black text-yellow-500">{pendingMotos}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* LISTA DE MOTOS CON EDICIÓN */}
        <div>
          <h2 className="mb-8 text-3xl font-black">Mis publicaciones</h2>

          {motorcycles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950 p-16 text-center">
              <Bike className="mx-auto h-16 w-16 text-zinc-700" />
              <h3 className="mt-6 text-2xl font-black">No tienes motos publicadas</h3>
              <p className="mt-3 text-zinc-400">Publica tu primera subasta.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {motorcycles.map((moto, index) => (
                <motion.div
                  key={moto.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 transition hover:border-orange-500/30"
                >
                  <img src={moto.image_url} alt={moto.brand} className="h-64 w-full object-cover" />

                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-black">
                        {moto.brand} <span className="text-orange-500">{moto.model}</span>
                      </h3>
                      {getStatusBadge(moto)}
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-zinc-400">
                      <p>📍 {moto.city}</p>
                      <p>📅 {moto.year}</p>
                      <p>🛣️ {moto.mileage.toLocaleString()} km</p>
                      <p>🪪 {moto.plate}</p>
                    </div>

                    {/* 🔥 FORMULARIO DE EDICIÓN - Aparece al hacer clic en el lápiz */}
                    {editingMoto === moto.id ? (
                      <div className="mt-6 space-y-3">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder={`Precio actual: $${moto.base_price.toLocaleString()}`}
                          className="w-full rounded-2xl border border-zinc-800 bg-black p-3 text-white focus:border-orange-500 focus:outline-none"
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder={moto.description || "Descripción de la moto"}
                          rows={3}
                          className="w-full rounded-2xl border border-zinc-800 bg-black p-3 text-white resize-none focus:border-orange-500 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateMotorcycle(moto.id)}
                            className="flex-1 rounded-2xl bg-green-500 py-2 font-bold text-black hover:bg-green-400"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditingMoto(null);
                              setEditPrice("");
                              setEditDescription("");
                            }}
                            className="flex-1 rounded-2xl border border-zinc-700 py-2 font-bold text-white hover:bg-zinc-800"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-6">
                          <p className="text-sm text-zinc-500">Precio base</p>
                          <h4 className="text-4xl font-black text-orange-500">
                            ${moto.base_price.toLocaleString()}
                          </h4>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-zinc-400">
                          {moto.description || "Sin descripción"}
                        </p>
                      </>
                    )}

                    <div className="mt-8 flex gap-3">
                      <Link
                        href={`/subasta/${moto.id}`}
                        className="flex-1 rounded-2xl bg-orange-500 py-3 text-center font-black text-black transition hover:bg-orange-400"
                      >
                        Ver
                      </Link>
                      
                      {/* 🔥 BOTÓN EDITAR (LÁPIZ) - Solo aparece cuando NO estamos editando */}
                      {editingMoto !== moto.id && (
                        <button
                          onClick={() => {
                            setEditingMoto(moto.id);
                            setEditPrice(moto.base_price.toString());
                            setEditDescription(moto.description || "");
                          }}
                          className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-5 text-blue-400 transition hover:bg-blue-500 hover:text-white"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteMotorcycle(moto.id)}
                        className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 text-red-400 transition hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}