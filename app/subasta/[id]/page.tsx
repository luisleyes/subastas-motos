import { supabase } from "@/lib/supabase";
import BidSection from "@/components/BidSection";
import Countdown from "@/components/Countdown";
import LiveBids from "@/components/LiveBids";
import Link from "next/link";

export default async function SubastaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

  const { data: motorcycle, error } =
    await supabase
      .from("motorcycles")
      .select("*")
      .eq("id", id)
      .single();

  console.log(error);

  if (!motorcycle) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Moto no encontrada
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12">

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">

        {/* Imagen */}

        <div>

          <img
            src={motorcycle.image_url}
            alt={motorcycle.brand}
            className="h-[500px] w-full rounded-3xl object-cover"
          />

        </div>

        {/* Información */}

        <div>

          {/* Título */}

          <div className="mb-6 flex items-center gap-4">

            <h1 className="text-5xl font-black text-white">
              {motorcycle.brand} {motorcycle.model}
            </h1>

          </div>

          {/* Info */}

          <div className="space-y-4 text-lg text-zinc-400">

            <p>
              📍 {motorcycle.city}
            </p>

            <p>
              📅 {motorcycle.year}
            </p>

            <p>
              🛣️ {motorcycle.mileage.toLocaleString()} km
            </p>

            <p>
              🪪 {motorcycle.plate}
            </p>

          </div>

          {/* Precio */}

          <div className="mt-10 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-8">

            <p className="text-sm uppercase tracking-widest text-orange-400">
              Precio base
            </p>

            <h2 className="mt-3 text-6xl font-black text-orange-500">

              ${
                motorcycle.base_price.toLocaleString()
              }

            </h2>

          </div>

          {/* Countdown */}

          <div className="mt-8">

            <Countdown
              endDate={motorcycle.auction_end}
            />

          </div>

          {/* Detalles */}

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-8">

            <h3 className="mb-4 text-2xl font-black text-white">
              Detalles
            </h3>

            <p className="leading-relaxed text-zinc-400">
              {motorcycle.description}
            </p>

          </div>

          {/* Botones */}

          <div className="mt-10 flex gap-4">

            <button
              className="flex-1 rounded-3xl bg-orange-500 py-5 text-xl font-black text-black"
            >
              PUJAR AHORA
            </button>

            <Link
              href="/"
              className="rounded-3xl border border-zinc-700 px-8 py-5 font-black text-white"
            >
              Volver
            </Link>

          </div>

          {/* Bid Section */}

          <BidSection
            motorcycleId={motorcycle.id}
            
            basePrice={motorcycle.base_price}
          />
          <LiveBids motorcycleId={motorcycle.id} />
        </div>

      </div>

    </main>
  );
}