"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Star, Trash2, Eye, Users, Bike, Ban, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// ======================
// TIPOS
// ======================

interface UserWithStatus {
  id: string;
  email: string;
  created_at: string;
  status: string;
  reason: string | null;
  suspended_at: string | null;
  motos_count: number;
  bids_count: number;
}

// ======================
// COMPONENTE DE GESTIÓN DE USUARIOS
// ======================

function UsersManagement() {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithStatus | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      // 🔴 CAMBIADO: Usar API route en lugar de supabase.auth.admin.listUsers()
      const response = await fetch("/api/admin/users");
      const authUsers = await response.json();
      
      // Obtener estado de usuarios
      const { data: statuses } = await supabase
        .from("user_status")
        .select("*");
      
      // Obtener conteo de motos por usuario
      const { data: motos } = await supabase
        .from("motorcycles")
        .select("user_email");
      
      // Obtener conteo de pujas por usuario
      const { data: bids } = await supabase
        .from("bids")
        .select("bidder_email");
      
      const userMap = new Map();
      
      // 🔴 CAMBIADO: Eliminado el ? porque authUsers siempre existe
      authUsers.forEach((authUser: any) => {
        const status = statuses?.find((s: any) => s.user_id === authUser.id);
        userMap.set(authUser.id, {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          status: status?.status || "active",
          reason: status?.reason || null,
          suspended_at: status?.suspended_at || null,
          motos_count: motos?.filter((m: any) => m.user_email === authUser.email).length || 0,
          bids_count: bids?.filter((b: any) => b.bidder_email === authUser.email).length || 0,
        });
      });
      
      setUsers(Array.from(userMap.values()));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: string, reason?: string) => {
    const { error } = await supabase
      .from("user_status")
      .upsert({
        user_id: userId,
        status,
        reason: reason || null,
        suspended_at: status === "suspended" ? new Date().toISOString() : null,
        reactivated_at: status === "active" ? new Date().toISOString() : null,
      });
    
    if (error) {
      alert("Error al actualizar estado");
      return;
    }
    
    alert(`✅ Usuario ${status === "suspended" ? "suspendido" : "reactivado"} correctamente`);
    fetchUsers();
    setShowSuspendModal(false);
    setSuspendReason("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">🟢 Activo</span>;
      case "suspended":
        return <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400">🟡 Suspendido</span>;
      case "banned":
        return <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">🔴 Baneado</span>;
      default:
        return <span className="rounded-full bg-zinc-500/20 px-3 py-1 text-xs font-bold text-zinc-400">⚪ Desconocido</span>;
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats de usuarios */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <p className="text-sm text-zinc-500">Total usuarios</p>
          <p className="text-3xl font-black text-orange-500">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <p className="text-sm text-zinc-500">Usuarios activos</p>
          <p className="text-3xl font-black text-green-500">
            {users.filter((u) => u.status === "active").length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <p className="text-sm text-zinc-500">Suspendidos</p>
          <p className="text-3xl font-black text-yellow-500">
            {users.filter((u) => u.status === "suspended").length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <p className="text-sm text-zinc-500">Baneados</p>
          <p className="text-3xl font-black text-red-500">
            {users.filter((u) => u.status === "banned").length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="🔍 Buscar usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-white focus:border-orange-500 focus:outline-none"
        >
          <option value="todos">Todos</option>
          <option value="active">Activos</option>
          <option value="suspended">Suspendidos</option>
          <option value="banned">Baneados</option>
        </select>
        <button
          onClick={fetchUsers}
          className="rounded-2xl border border-zinc-700 px-5 py-3 text-white transition hover:bg-zinc-800"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Tabla de usuarios */}
      <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-950">
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-zinc-400">Usuario</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-zinc-400">Estado</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-zinc-400">Motos</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-zinc-400">Pujas</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-zinc-400">Registro</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-zinc-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-white">{user.email}</p>
                      <p className="text-xs text-zinc-500">{user.id.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                  <td className="px-6 py-4">
                    <span className="text-white">{user.motos_count}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{user.bids_count}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.status === "active" ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowSuspendModal(true);
                          }}
                          className="rounded-xl bg-yellow-500/20 px-4 py-2 text-sm font-bold text-yellow-400 transition hover:bg-yellow-500 hover:text-black"
                        >
                          Suspender
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserStatus(user.id, "active")}
                          className="rounded-xl bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500 hover:text-black"
                        >
                          Reactivar
                        </button>
                      )}
                    </div>
                   </td>
                 </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de suspensión */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8"
          >
            <h3 className="text-2xl font-black text-white">Suspender usuario</h3>
            <p className="mt-2 text-zinc-400">
              Usuario: <span className="text-orange-500">{selectedUser.email}</span>
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Motivo de la suspensión..."
              className="mt-4 h-32 w-full rounded-2xl border border-zinc-800 bg-black p-4 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => updateUserStatus(selectedUser.id, "suspended", suspendReason)}
                className="flex-1 rounded-2xl bg-yellow-500 py-3 font-bold text-black"
              >
                Suspender
              </button>
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 rounded-2xl border border-zinc-700 py-3 font-bold text-white"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ======================
// COMPONENTE PRINCIPAL
// ======================

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [motorcycles, setMotorcycles] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"motos" | "usuarios">("motos");

  // Verificar admin
  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // NO LOGIN
    if (!session) {
      router.push("/login");
      return;
    }

    // NO ES ADMIN (compara con variable de entorno)
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    if (session.user.email !== adminEmail) {
      router.push("/");
      return;
    }

    setIsAdmin(true);
    await fetchMotorcycles();
    setLoading(false);
  };

  const fetchMotorcycles = async () => {
    const { data } = await supabase
      .from("motorcycles")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    setMotorcycles(data || []);
  };

  const deleteMoto = async (id: string) => {
    const confirmDelete = confirm("¿Eliminar publicación permanentemente?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("motorcycles")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error al eliminar");
      return;
    }

    fetchMotorcycles();
    alert("✅ Moto eliminada");
  };

  const approveMoto = async (id: string) => {
    const { error } = await supabase
      .from("motorcycles")
      .update({
        approved: true,
        rejected: false,
      })
      .eq("id", id);

    if (error) {
      alert("Error al aprobar");
      return;
    }

    fetchMotorcycles();
    alert("✅ Moto aprobada");
  };

  const rejectMoto = async (id: string) => {
    const { error } = await supabase
      .from("motorcycles")
      .update({
        rejected: true,
        approved: false,
      })
      .eq("id", id);

    if (error) {
      alert("Error al rechazar");
      return;
    }

    fetchMotorcycles();
    alert("❌ Moto rechazada");
  };

  const featureMoto = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("motorcycles")
      .update({
        featured: !current,
      })
      .eq("id", id);

    if (error) {
      alert("Error al destacar");
      return;
    }

    fetchMotorcycles();
    alert(!current ? "⭐ Moto destacada" : "⭐ Moto ya no está destacada");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="mt-4 text-zinc-400">Verificando acceso...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const totalMotos = motorcycles.length;
  const approvedMotos = motorcycles.filter((m) => m.approved).length;
  const pendingMotos = motorcycles.filter((m) => !m.approved && !m.rejected).length;
  const featuredMotos = motorcycles.filter((m) => m.featured).length;

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-6xl font-black bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            PANEL ADMIN
          </h1>
          <p className="mt-3 text-zinc-400">
            Control total de la plataforma - Gestiona motos, usuarios y más
          </p>
        </div>

        {/* TABS */}
        <div className="mb-8 flex gap-2 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("motos")}
            className={`flex items-center gap-2 px-6 py-3 font-bold transition ${
              activeTab === "motos"
                ? "border-b-2 border-orange-500 text-orange-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Bike className="h-5 w-5" />
            Motos
          </button>
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`flex items-center gap-2 px-6 py-3 font-bold transition ${
              activeTab === "usuarios"
                ? "border-b-2 border-orange-500 text-orange-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="h-5 w-5" />
            Usuarios
          </button>
        </div>

        {/* CONTENIDO - MOTOS */}
        {activeTab === "motos" ? (
          <>
            {/* STATS */}
            <div className="mb-10 grid gap-6 md:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Total motos</p>
                <p className="text-3xl font-black text-orange-500">{totalMotos}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Aprobadas</p>
                <p className="text-3xl font-black text-green-500">{approvedMotos}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Pendientes</p>
                <p className="text-3xl font-black text-yellow-500">{pendingMotos}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Destacadas</p>
                <p className="text-3xl font-black text-orange-500">{featuredMotos}</p>
              </div>
            </div>

            {/* LISTA DE MOTOS */}
            {motorcycles.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950 p-16 text-center">
                <p className="text-zinc-400">No hay motos publicadas aún</p>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-2">
                {motorcycles.map((moto, index) => (
                  <motion.div
                    key={moto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 transition hover:border-orange-500/30"
                  >
                    <img
                      src={moto.image_url}
                      alt={`${moto.brand} ${moto.model}`}
                      className="h-72 w-full object-cover"
                    />

                    <div className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-black">
                            {moto.brand} <span className="text-orange-500">{moto.model}</span>
                          </h2>
                          {moto.featured && (
                            <span className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 text-xs font-black text-black">
                              ⭐ DESTACADA
                            </span>
                          )}
                          {moto.approved && (
                            <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-black text-black">
                              ✅ Aprobada
                            </span>
                          )}
                          {moto.rejected && (
                            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
                              ❌ Rechazada
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
                        <p>📧 {moto.user_email || "No especificado"}</p>
                        <p>📍 {moto.city}</p>
                        <p>🪪 {moto.plate}</p>
                        <p>📅 {moto.year}</p>
                        <p>🛣️ {moto.mileage.toLocaleString()} km</p>
                        <p>💰 ${moto.base_price.toLocaleString()}</p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          onClick={() => approveMoto(moto.id)}
                          disabled={moto.approved}
                          className={`flex items-center gap-2 rounded-xl px-5 py-3 font-black text-black transition ${
                            moto.approved
                              ? "cursor-not-allowed bg-green-500/50"
                              : "bg-green-500 hover:bg-green-400"
                          }`}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aprobar
                        </button>

                        <button
                          onClick={() => rejectMoto(moto.id)}
                          disabled={moto.rejected}
                          className={`flex items-center gap-2 rounded-xl px-5 py-3 font-black text-black transition ${
                            moto.rejected
                              ? "cursor-not-allowed bg-yellow-500/50"
                              : "bg-yellow-500 hover:bg-yellow-400"
                          }`}
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar
                        </button>

                        <button
                          onClick={() => featureMoto(moto.id, moto.featured)}
                          className={`flex items-center gap-2 rounded-xl px-5 py-3 font-black text-black transition ${
                            moto.featured
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "bg-orange-500 hover:bg-orange-400"
                          }`}
                        >
                          <Star className="h-4 w-4" />
                          {moto.featured ? "Quitar Destacar" : "Destacar"}
                        </button>

                        <button
                          onClick={() => deleteMoto(moto.id)}
                          className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <UsersManagement />
        )}
      </div>
    </main>
  );
}