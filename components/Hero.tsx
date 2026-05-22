"use client";

import { motion } from "framer-motion";

export default function Hero() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden px-6 py-24"
        >
            {/* Fondo degradado */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent" />

            <div className="relative mx-auto max-w-7xl text-center">
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
                    <span className="text-white">Subasta de Motos</span>
                    <br />
                    <span className="text-orange-500">En Cartagena</span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
                     Encuentra motos deportivas, naked y urbanas en subastas
                    reales con tiempo limitado y compradores compitiendo en vivo.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-black transition hover:bg-orange-400"
                    >
                        Ver Subastas Activas
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800"
                    >
                        Cómo Funciona
                    </motion.button>
                </div>
            </div>
        </motion.section>
    );
}