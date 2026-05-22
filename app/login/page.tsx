"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {

    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    
    // 1. Mostrar/ocultar contraseña
    const [showPassword, setShowPassword] = useState(false);
    
    // 2. Resetear contraseña
    const [resetMode, setResetMode] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    
    // 3. Manejo de errores amigable
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // Validar email
    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    // Validar contraseña
    const validatePassword = (password: string) => {
        return password.length >= 6;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validaciones amigables
        const newErrors: { email?: string; password?: string } = {};
        
        if (!validateEmail(email)) {
            newErrors.email = "Ingresa un correo electrónico válido";
        }
        
        if (!isLogin && !validatePassword(password)) {
            newErrors.password = "La contraseña debe tener al menos 6 caracteres";
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setErrors({});
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    // Mensajes de error amigables
                    if (error.message.includes("Email not confirmed")) {
                        alert("📧 Por favor, confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o spam.");
                    } else if (error.message.includes("Invalid login credentials")) {
                        alert("❌ Correo o contraseña incorrectos. Intenta nuevamente.");
                    } else {
                        alert(`❌ ${error.message}`);
                    }
                    setLoading(false);
                    return;
                }

                alert("✅ ¡Bienvenido a MotoSubastas! 🔥");
                router.push("/");

            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name },
                        emailRedirectTo: `${window.location.origin}/login`,
                    },
                });

                if (error) {
                    // Mensajes de error amigables
                    if (error.message.includes("User already registered")) {
                        alert("❌ Este correo ya está registrado. Inicia sesión en tu cuenta.");
                    } else {
                        alert(`❌ ${error.message}`);
                    }
                    setLoading(false);
                    return;
                }

                alert("📧 ¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.");
                setIsLogin(true);
                setPassword("");
            }

        } catch (error) {
            console.log(error);
            alert("❌ Ocurrió un error inesperado. Por favor, intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    // Función para resetear contraseña
    const handleResetPassword = async () => {
        if (!validateEmail(resetEmail)) {
            alert("❌ Ingresa un correo electrónico válido");
            return;
        }

        setResetLoading(true);
        
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            alert(`❌ ${error.message}`);
        } else {
            alert("📧 Se ha enviado un enlace de recuperación a tu correo electrónico");
            setResetMode(false);
            setResetEmail("");
        }
        
        setResetLoading(false);
    };

    // Pantalla de resetear contraseña
    if (resetMode) {
        return (
            <main className="relative flex min-h-screen items-center justify-center px-6 py-24 bg-black overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-500/20 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-orange-500/10 blur-[120px]" />
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full max-w-md"
                >
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8 shadow-2xl">
                        <div className="mb-8 text-center">
                            <h1 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                                Recuperar contraseña
                            </h1>
                            <p className="mt-3 text-zinc-400">
                                Te enviaremos un enlace para crear una nueva contraseña
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/50 pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                                />
                            </div>
                            <button
                                onClick={handleResetPassword}
                                disabled={resetLoading}
                                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 font-black text-black transition hover:from-orange-400 hover:to-orange-500 disabled:opacity-50"
                            >
                                {resetLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                            </button>
                            <button
                                onClick={() => setResetMode(false)}
                                className="w-full rounded-2xl border border-zinc-700 py-3 font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-800"
                            >
                                Volver al inicio de sesión
                            </button>
                        </div>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center px-6 py-24 bg-black overflow-hidden">

            {/* Fondo decorativo */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-500/20 blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-orange-500/10 blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >

                {/* Tarjeta */}
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8 shadow-2xl">

                    {/* Logo */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-black tracking-tight">
                            <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                                MotoSubastas
                            </span>
                        </h1>
                        <p className="mt-3 text-zinc-400">
                            {isLogin ? "Bienvenido de vuelta" : "Crea tu cuenta"}
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-300">
                                    Nombre completo
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/50 pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                                        placeholder="Juan Pérez"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-300">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors({ ...errors, email: undefined });
                                    }}
                                    className={`w-full rounded-2xl border ${errors.email ? 'border-red-500' : 'border-zinc-700'} bg-zinc-800/50 pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition`}
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-300">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) setErrors({ ...errors, password: undefined });
                                    }}
                                    className={`w-full rounded-2xl border ${errors.password ? 'border-red-500' : 'border-zinc-700'} bg-zinc-800/50 pl-11 pr-12 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition`}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-orange-500 transition"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> {errors.password}
                                </p>
                            )}
                        </div>

                        {isLogin && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setResetMode(true)}
                                    className="text-sm text-zinc-400 hover:text-orange-500 transition"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 font-black text-black transition hover:from-orange-400 hover:to-orange-500 disabled:opacity-50"
                        >
                            {loading ? (isLogin ? "Entrando..." : "Creando...") : (isLogin ? "Iniciar sesión" : "Crear cuenta")}
                        </motion.button>
                    </form>

                    {/* Separador */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-zinc-900/50 px-2 text-zinc-500">o</span>
                        </div>
                    </div>

                    {/* Alternar */}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setErrors({});
                            setPassword("");
                        }}
                        className="w-full rounded-2xl border border-zinc-700 py-3 font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-800"
                    >
                        {isLogin ? "Crear cuenta nueva" : "Ya tengo una cuenta"}
                    </button>

                </div>

                {/* Volver */}
                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-zinc-500 hover:text-orange-500 transition">
                        ← Volver al inicio
                    </Link>
                </div>

            </motion.div>

        </main>
    );
}