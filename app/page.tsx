"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import Footer from "@/components/footer";
import Link from "next/link";

import { motion } from "framer-motion";

import {
  Flame,
  Gavel,
  TrendingUp,
  Shield,
  Clock,
  Sparkles,
  CheckCircle,
  Bike,
  Users,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function HomePage() {

  const router = useRouter();

  const [motorcycles, setMotorcycles] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [user, setUser] =
    useState<any>(null);

  const [userEmail, setUserEmail] = useState("");

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  /*
  =========================
  GET USER
  =========================
  */

  useEffect(() => {

    const getUser = async () => {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();

  }, []);

  /*
  =========================
  GET SESSION & USER EMAIL & PROFILE
  =========================
  */

  useEffect(() => {

    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };

    getSession();

  }, []);

  /*
  =========================
  CARGAR PERFIL DE USUARIO
  =========================
  */

  useEffect(() => {

    const loadUser = async () => {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session) {

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(data);
      }
    };

    loadUser();

  }, []);

  /*
  =========================
  GET MOTOS
  =========================
  */

  useEffect(() => {

    const fetchMotorcycles =
      async () => {

        const { data } =
          await supabase
            .from("motorcycles")
            .select("*")
            .eq("approved", true)
            .order("created_at", {
              ascending: false,
            });

        setMotorcycles(data || []);

        setLoading(false);
      };

    fetchMotorcycles();

  }, []);

  const totalMotos =
    motorcycles?.length || 0;

  const precioPromedio =
    motorcycles?.reduce(
      (acc, m) =>
        acc + m.base_price,
      0
    ) / totalMotos || 0;

  /*
  =========================
  LOADING
  =========================
  */

  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-black">

        <div className="text-center">

          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500"></div>

          <p className="mt-4 text-zinc-400">

            Cargando subastas...

          </p>

        </div>

      </main>
    );
  }

  return (

    <main className="min-h-screen overflow-x-hidden bg-black text-white">

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/70 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            href="/"
            className="group flex items-center gap-2 text-2xl font-black tracking-tight"
          >

            <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">

              Subastas Motos

            </span>

            <span className="text-orange-500">

              🏍️

            </span>

          </Link>

          {/* NUEVA BARRA DE USUARIO CON AVATAR */}
          <div className="flex items-center gap-4">

            <Link
              href="/publicar"
              className="rounded-2xl bg-orange-500 px-5 py-3 font-black text-black transition hover:bg-orange-400"
            >
              + Publicar Moto
            </Link>

            {session ? (

              <div className="flex items-center gap-3">

                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 transition hover:border-orange-500"
                >

                  <img
                    src={
                      profile?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${profile?.name || "User"}`
                    }
                    alt="avatar"
                    className="h-10 w-10 rounded-full object-cover"
                  />

                  <div className="text-left">
                    <p className="text-sm font-bold text-white">
                      {profile?.name || "Usuario"}
                    </p>

                    <p className="text-xs text-zinc-500">
                      Mi perfil
                    </p>
                  </div>

                </Link>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.reload();
                  }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                >
                  Salir
                </button>

              </div>

            ) : (

              <Link
                href="/login"
                className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-6 py-3 font-bold text-orange-400 transition hover:bg-orange-500 hover:text-black"
              >
                Iniciar sesión
              </Link>

            )}

          </div>

        </div>

      </header>

      {/* HERO */}

      <section className="relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-black/0 to-black" />

        <div className="relative mx-auto max-w-7xl px-6 py-32">

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            className="max-w-4xl"
          >

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-5 py-2">

              <Flame className="h-4 w-4 text-orange-500" />

              <span className="text-sm text-orange-400">

                Subastas en tiempo real

              </span>

            </div>

            <h1 className="text-6xl font-black leading-tight md:text-7xl">

              Compra motos únicas y verificadas

              <span className="block bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">

                antes que todos

              </span>

            </h1>

            <p className="mt-8 max-w-2xl text-xl text-zinc-400">

              Encuentra motos, puja en tiempo real y asegura oportunidades únicas.

            </p>

          </motion.div>

        </div>

      </section>

      {/* SUBASTAS */}

      <section className="mx-auto max-w-7xl px-6 py-24">

        <div className="mb-16 flex items-end justify-between">

          <div>

            <h2 className="text-5xl font-black">

              Subastas activas

            </h2>

            <p className="mt-3 text-zinc-400">

              Oportunidades que no querrás perder.

            </p>

          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-8 py-4">

            <p className="text-sm text-orange-400">

              EN SUBASTA

            </p>

            <p className="text-4xl font-black text-orange-500">

              {totalMotos}

            </p>

          </div>

        </div>

        {
          totalMotos === 0 ? (

            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/50 py-20 text-center">

              <Sparkles className="mx-auto h-16 w-16 text-zinc-700" />

              <h3 className="mt-4 text-2xl font-bold">

                No hay subastas activas

              </h3>

            </div>

          ) : (

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

              {
                motorcycles.map((moto, index) => (

                  <motion.div
                    key={moto.id}
                    initial={{
                      opacity: 0,
                      y: 30,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                    }}
                    className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 transition hover:border-orange-500/30"
                  >

                    <img
                      src={moto.image_url}
                      alt={moto.brand}
                      className="h-72 w-full object-cover transition duration-500 hover:scale-105"
                    />

                    <div className="p-6">

                      <h3 className="text-3xl font-black">

                        {moto.brand}

                        {" "}

                        <span className="text-orange-500">

                          {moto.model}

                        </span>

                      </h3>

                      <div className="mt-4 space-y-2 text-sm text-zinc-400">

                        <p>
                          📍 {moto.city}
                        </p>

                        <p>
                          📅 {moto.year}
                        </p>

                        <p>
                          🛣️ {moto.mileage.toLocaleString()} km
                        </p>

                        <p>
                          🪪 {moto.plate}
                        </p>

                      </div>

                      <div className="mt-3 text-sm text-orange-400">

                        👤 Publicado por:

                        {" "}

                        {moto.user_email || "Usuario"}

                      </div>

                      <div className="mt-8 flex items-end justify-between">

                        <div>

                          <p className="text-xs text-zinc-500">

                            Precio base

                          </p>

                          <p className="text-4xl font-black text-orange-500">

                            $

                            {moto.base_price.toLocaleString()}

                          </p>

                        </div>

                        <Link
                          href={`/subasta/${moto.id}`}
                          className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-black transition hover:bg-orange-400"
                        >

                          Ver subasta

                        </Link>

                      </div>

                    </div>

                  </motion.div>
                ))
              }

            </div>
          )
        }

      </section>

      {/* ===================================== */}
      {/* QUIÉNES SOMOS */}
      {/* ===================================== */}

      <section className="border-t border-zinc-900 bg-zinc-950/40 py-28">

        <div className="mx-auto max-w-7xl px-6">

          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

            <div>

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-5 py-2">
                <Users className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-400">
                  ¿Quiénes somos?
                </span>
              </div>

              <h2 className="text-5xl font-black leading-tight">

                Una plataforma creada para revolucionar las

                <span className="block text-orange-500">
                  subastas de motos
                </span>

              </h2>

              <p className="mt-8 text-lg leading-relaxed text-zinc-400">

                Creamos un espacio donde compradores y vendedores
                pueden participar en subastas reales, seguras y
                transparentes.

                Nuestro objetivo es conectar oportunidades únicas
                con personas apasionadas por el mundo de las motos.

              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
                  <p className="text-3xl font-black text-orange-500">
                    +100
                  </p>
                  <p className="mt-2 text-zinc-400">
                    Usuarios interesados
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
                  <p className="text-3xl font-black text-orange-500">
                    100%
                  </p>
                  <p className="mt-2 text-zinc-400">
                    Publicaciones moderadas
                  </p>
                </div>

              </div>

            </div>

            <div className="rounded-[2rem] border border-orange-500/10 bg-gradient-to-br from-orange-500/10 to-black p-10">

              <div className="space-y-6">

                <div className="flex items-start gap-4">
                  <CheckCircle className="mt-1 h-6 w-6 text-orange-500" />
                  <div>
                    <h3 className="text-xl font-bold">
                      Publicaciones verificadas
                    </h3>
                    <p className="mt-2 text-zinc-400">
                      Revisamos manualmente las publicaciones antes de aparecer en la plataforma.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Shield className="mt-1 h-6 w-6 text-orange-500" />
                  <div>
                    <h3 className="text-xl font-bold">
                      Plataforma segura
                    </h3>
                    <p className="mt-2 text-zinc-400">
                      Protegemos la experiencia con moderación y control constante.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <TrendingUp className="mt-1 h-6 w-6 text-orange-500" />
                  <div>
                    <h3 className="text-xl font-bold">
                      Oportunidades reales
                    </h3>
                    <p className="mt-2 text-zinc-400">
                      Encuentra motos únicas y vende al mejor precio posible.
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================== */}
      {/* CÓMO FUNCIONA */}
      {/* ===================================== */}

      <section className="py-28">

        <div className="mx-auto max-w-7xl px-6">

          <div className="text-center">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-5 py-2">
              <Bike className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-400">
                ¿Cómo funciona?
              </span>
            </div>

            <h2 className="text-5xl font-black">
              Compra y vende en 3 pasos
            </h2>

          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-3xl font-black text-black">
                1
              </div>

              <h3 className="mt-8 text-3xl font-black">
                Publica tu moto
              </h3>

              <p className="mt-4 text-zinc-400">
                Sube fotos, información y establece el precio base.
              </p>

            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-3xl font-black text-black">
                2
              </div>

              <h3 className="mt-8 text-3xl font-black">
                Recibe pujas
              </h3>

              <p className="mt-4 text-zinc-400">
                Los compradores compiten en tiempo real por tu moto.
              </p>

            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-3xl font-black text-black">
                3
              </div>

              <h3 className="mt-8 text-3xl font-black">
                Vende al mejor precio
              </h3>

              <p className="mt-4 text-zinc-400">
                Conecta con compradores reales y cierra oportunidades únicas.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================== */}
      {/* POR QUÉ CONFIAR */}
      {/* ===================================== */}

      <section className="border-y border-zinc-900 bg-zinc-950/40 py-28">

        <div className="mx-auto max-w-7xl px-6">

          <div className="text-center">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-5 py-2">
              <BadgeCheck className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-400">
                ¿Por qué confiar?
              </span>
            </div>

            <h2 className="text-5xl font-black">
              Diseñado para generar confianza
            </h2>

          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">

            <div className="rounded-3xl border border-zinc-800 bg-black/40 p-10">
              <Shield className="h-12 w-12 text-orange-500" />
              <h3 className="mt-6 text-2xl font-black">
                Moderación activa
              </h3>
              <p className="mt-4 text-zinc-400">
                Revisamos publicaciones y usuarios constantemente.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-black/40 p-10">
              <Clock className="h-12 w-12 text-orange-500" />
              <h3 className="mt-6 text-2xl font-black">
                Tiempo real
              </h3>
              <p className="mt-4 text-zinc-400">
                Participa en subastas dinámicas y transparentes.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-black/40 p-10">
              <Gavel className="h-12 w-12 text-orange-500" />
              <h3 className="mt-6 text-2xl font-black">
                Oportunidades únicas
              </h3>
              <p className="mt-4 text-zinc-400">
                Encuentra motos difíciles de conseguir al mejor precio.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* ===================================== */}
      {/* CTA FINAL */}
      {/* ===================================== */}

      <section className="py-32">

        <div className="mx-auto max-w-5xl px-6 text-center">

          <h2 className="text-6xl font-black leading-tight">

            ¿Listo para encontrar tu próxima moto?

          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-xl text-zinc-400">

            Explora subastas activas o publica tu moto y llega a compradores reales.

          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-5">

            <Link
              href="/"
              className="rounded-2xl bg-orange-500 px-8 py-5 font-black text-black transition hover:bg-orange-400"
            >
              Explorar subastas
            </Link>

            <Link
              href="/publicar"
              className="rounded-2xl border border-zinc-700 px-8 py-5 font-black text-white transition hover:border-orange-500 hover:text-orange-500"
            >
              Publicar mi moto
            </Link>

          </div>

        </div>

      </section>

      {/* ===================================== */}
      {/* FOOTER */}
      {/* ===================================== */}

      <Footer />

    </main>
  );
}