"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Motorcycle } from "@/types/motorcycle";

interface Props {
  motorcycle: Motorcycle;
}

export default function MotorcycleCard({
  motorcycle,
}: Props) {

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950"
    >

      <img
        src={motorcycle.image_url}
        alt={motorcycle.brand}
        className="h-64 w-full object-cover"
      />

      <div className="p-6">

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-2xl font-black text-white">
            {motorcycle.brand} {motorcycle.model}
          </h2>

          {
            motorcycle.verified && (
              <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-black">
                VERIFICADA
              </span>
            )
          }

        </div>

        <div className="space-y-2 text-zinc-400">

          <p>
            📍 {motorcycle.city}
          </p>

          <p>
            🛣️ {motorcycle.mileage.toLocaleString()} km
          </p>

          <p>
            📅 {motorcycle.year}
          </p>

        </div>

        <div className="mt-6 flex items-center justify-between">

          <div>

            <p className="text-sm text-zinc-500">
              Precio base
            </p>

            <p className="text-3xl font-black text-orange-500">
              ${
                motorcycle.base_price.toLocaleString()
              }
            </p>

          </div>

          <Link
            href={`/subasta/${motorcycle.id}`}
            className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-black transition hover:scale-105"
          >
            Ver Subasta
          </Link>

        </div>

      </div>

    </motion.div>
  );
}