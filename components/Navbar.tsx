"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };

        getUser();

        // Escuchar cambios en la autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    // Mostrar solo el email sin dominio
    const displayEmail = user?.email ? user.email : "";

    return (
        <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/70 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link 
                        href="/" 
                        className="text-2xl font-black tracking-tight bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent hover:from-orange-400 hover:to-orange-300 transition-all duration-300"
                    >
                        MotoSubastas
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden items-center gap-8 md:flex">
                        <Link 
                            href="/" 
                            className="text-sm font-medium text-zinc-300 transition-all duration-200 hover:text-orange-500 hover:scale-105"
                        >
                            Inicio
                        </Link>
                        <Link 
                            href="/publicar" 
                            className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-5 py-2 text-sm font-semibold text-orange-500 transition-all duration-200 hover:bg-orange-500 hover:text-black hover:shadow-lg hover:shadow-orange-500/25"
                        >
                            ✨ Publicar Moto
                        </Link>
                        <Link 
                            href="/mis-pujas" 
                            className="text-sm font-medium text-zinc-300 transition-all duration-200 hover:text-orange-500 hover:scale-105"
                        >
                            Mis Pujas
                        </Link>
                        
                        {/* 🧠 NAVBAR INTELIGENTE */}
                        {!loading && (
                            user ? (
                                <div className="flex items-center gap-3">
                                    {/* EMAIL CLICKEABLE - AHORA ES UN LINK */}
                                    <Link
                                        href="/dashboard"
                                        className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-400 transition hover:bg-orange-500 hover:text-black"
                                    >
                                        👋 {displayEmail}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                                    >
                                        Salir
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="rounded-lg bg-white/5 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-orange-500 hover:text-black hover:shadow-lg hover:shadow-orange-500/25"
                                >
                                    Iniciar sesión
                                </Link>
                            )
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 md:hidden"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="flex flex-col space-y-4 pb-6 pt-4 md:hidden">
                        <Link 
                            href="/" 
                            className="rounded-lg px-4 py-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-orange-500"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Inicio
                        </Link>
                        <Link 
                            href="/publicar" 
                            className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-2 text-center font-semibold text-orange-500 transition-colors hover:bg-orange-500 hover:text-black"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            ✨ Publicar Moto
                        </Link>
                        <Link 
                            href="/mis-pujas" 
                            className="rounded-lg px-4 py-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-orange-500"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Mis Pujas
                        </Link>
                        
                        {/* Mobile: Navbar inteligente */}
                        {!loading && (
                            user ? (
                                <>
                                    {/* EMAIL CLICKEABLE EN MÓVIL */}
                                    <Link
                                        href="/dashboard"
                                        className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-center text-sm text-orange-400 transition hover:bg-orange-500 hover:text-black"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        👋 {displayEmail}
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-center font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                                    >
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <Link 
                                    href="/login" 
                                    className="rounded-lg bg-white/5 px-4 py-2 text-center text-white transition-colors hover:bg-orange-500 hover:text-black"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Iniciar sesión
                                </Link>
                            )
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}