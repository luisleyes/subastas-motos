"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Loader2, LogOut, Trash2, Key, ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [motorcycles, setMotorcycles] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  
  // Estados para editar perfil
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Estado para mostrar/ocultar secciones
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const user = session.user;

    // BUSCAR PERFIL
    let { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // SI NO EXISTE → CREAR
    if (!existingProfile) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            email: user.email,
            name: user.email?.split("@")[0],
          },
        ])
        .select()
        .single();

      existingProfile = newProfile;
    }

    setProfile(existingProfile);
    setName(existingProfile.name || "");

    // MOTOS PUBLICADAS
    const { data: motos } = await supabase
      .from("motorcycles")
      .select("*")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false });

    setMotorcycles(motos || []);

    // PUJAS CON DETALLE DE MOTO
    const { data: userBids } = await supabase
      .from("bids")
      .select("*")
      .eq("bidder_email", user.email)
      .order("created_at", { ascending: false });

    // Obtener detalles de las motos para cada puja
    const bidsWithDetails = await Promise.all(
      (userBids || []).map(async (bid) => {
        const { data: moto } = await supabase
          .from("motorcycles")
          .select("id, brand, model, image_url")
          .eq("id", bid.motorcycle_id)
          .single();
        return { ...bid, motorcycle: moto };
      })
    );

    setBids(bidsWithDetails || []);

    setLoading(false);
  };

  // ACTUALIZAR PERFIL
  const updateProfile = async () => {
    setUploading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
      })
      .eq("id", session.user.id);

    if (!error) {
      alert("✅ Perfil actualizado");
      setProfile({
        ...profile,
        name,
      });
    } else {
      alert("❌ Error al actualizar perfil");
    }

    setUploading(false);
  };

  // SUBIR FOTO DE PERFIL
  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setUploading(false);
      return;
    }

    const fileName = session.user.id + "-" + Date.now();

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (error) {
      alert("❌ Error al subir imagen: " + error.message);
      setUploading(false);
      return;
    }

    const avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;

    await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
      })
      .eq("id", session.user.id);

    setProfile({
      ...profile,
      avatar_url: avatarUrl,
    });

    alert("✅ Foto actualizada");
    setUploading(false);
  };

  // CERRAR SESIÓN
  const handleLogout = async () => {
    const confirmLogout = confirm("¿Seguro que deseas cerrar sesión?");
    if (!confirmLogout) return;
    
    await supabase.auth.signOut();
    router.push("/");
  };

  // ELIMINAR CUENTA
  const deleteAccount = async () => {
    const confirmDelete = confirm("⚠️ Esta acción es irreversible. ¿Estás seguro de eliminar tu cuenta?");
    if (!confirmDelete) return;
    
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) return;
    
    // Eliminar motos del usuario
    await supabase.from("motorcycles").delete().eq("user_id", session.user.id);
    
    // Eliminar perfil
    await supabase.from("profiles").delete().eq("id", session.user.id);
    
    // Cerrar sesión y eliminar cuenta
    await supabase.auth.signOut();
    alert("Cuenta eliminada correctamente");
    router.push("/");
  };

  // Calcular estadísticas
  const totalGastado = bids.reduce((acc, bid) => acc + bid.amount, 0);
  const promedioPuja = bids.length > 0 ? totalGastado / bids.length : 0;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8"
        >
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* AVATAR */}
            <div className="relative">
              <img
                src={
                  profile.avatar_url ||
                  `https://ui-avatars.com/api/?name=${profile.name}&background=EA580C&color=fff`
                }
                alt="avatar"
                className="h-32 w-32 rounded-full border-4 border-orange-500 object-cover"
              />
              <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-orange-500 p-3 text-black transition hover:bg-orange-400">
                <Camera className="h-5 w-5" />
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </label>
            </div>

            <div className="flex-1">
              <h1 className="text-5xl font-black">{profile.name}</h1>
              <p className="mt-2 text-zinc-400">{profile.email}</p>

              {/* FORMULARIO EDITAR NOMBRE */}
              <div className="mt-6 flex flex-col gap-4 max-w-md">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-white outline-none focus:border-orange-500 transition"
                />
                <button
                  onClick={updateProfile}
                  disabled={uploading}
                  className="rounded-2xl bg-orange-500 px-6 py-4 font-black text-black transition hover:bg-orange-400 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Guardar cambios"}
                </button>
              </div>

              {/* STATS */}
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="rounded-2xl bg-zinc-900 px-5 py-3">
                  <p className="text-sm text-zinc-500">Motos publicadas</p>
                  <p className="text-3xl font-black text-orange-500">{motorcycles.length}</p>
                </div>
                <div className="rounded-2xl bg-zinc-900 px-5 py-3">
                  <p className="text-sm text-zinc-500">Pujas realizadas</p>
                  <p className="text-3xl font-black text-orange-500">{bids.length}</p>
                </div>
                <div className="rounded-2xl bg-zinc-900 px-5 py-3">
                  <p className="text-sm text-zinc-500">Total invertido</p>
                  <p className="text-3xl font-black text-green-500">${totalGastado.toLocaleString()}</p>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-3 font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar sesión
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-6 py-3 font-bold text-white transition hover:border-red-500 hover:text-red-400"
                >
                  <Trash2 className="h-5 w-5" />
                  Eliminar cuenta
                </button>
              </div>

              {/* CONFIRMACIÓN DE ELIMINACIÓN */}
              {showDeleteConfirm && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm text-red-400">¿Estás seguro? Esta acción no se puede deshacer.</p>
                  <div className="mt-3 flex gap-3">
                    <button onClick={deleteAccount} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-black">
                      Sí, eliminar
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-white">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* MOTOS PUBLICADAS */}
        <div className="mt-12">
          <h2 className="mb-6 text-3xl font-black">🏍️ Tus motos publicadas</h2>

          {motorcycles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950 p-12 text-center">
              <p className="text-zinc-400">Aún no has publicado ninguna moto</p>
              <Link href="/publicar" className="mt-4 inline-block text-orange-500 hover:underline">
                Publicar tu primera moto →
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {motorcycles.map((moto) => (
                <Link
                  key={moto.id}
                  href={`/subasta/${moto.id}`}
                  className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 transition-all duration-300 hover:border-orange-500 hover:scale-[1.02]"
                >
                  <img src={moto.image_url} alt={moto.brand} className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="p-5">
                    <h3 className="text-2xl font-black">
                      {moto.brand} {moto.model}
                    </h3>
                    <p className="mt-3 text-3xl font-black text-orange-500">
                      ${Number(moto.base_price).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* PUJAS REALIZADAS CON DETALLE */}
        <div className="mt-16">
          <h2 className="mb-6 text-3xl font-black">🔥 Tus pujas</h2>

          {bids.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950 p-12 text-center">
              <p className="text-zinc-400">Aún no has realizado ninguna puja</p>
              <Link href="/" className="mt-4 inline-block text-orange-500 hover:underline">
                Explorar subastas →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition-all duration-300 hover:border-orange-500/30 hover:bg-zinc-900/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-zinc-500">Pujaste en</p>
                      {bid.motorcycle ? (
                        <Link href={`/subasta/${bid.motorcycle.id}`} className="group inline-flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition">
                            {bid.motorcycle.brand} {bid.motorcycle.model}
                          </h3>
                          <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-orange-500" />
                        </Link>
                      ) : (
                        <p className="text-white">Moto no disponible</p>
                      )}
                      <p className="mt-2 text-3xl font-black text-orange-500">
                        ${Number(bid.amount).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {new Date(bid.created_at).toLocaleString()}
                      </p>
                    </div>
                    {bid.motorcycle?.image_url && (
                      <img
                        src={bid.motorcycle.image_url}
                        alt={bid.motorcycle.model}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                    )}
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