import AuctionCard from "./AuctionCard";

export default function AuctionGrid() {
  return (
    <section className="px-6 pb-24">

      <div className="mx-auto max-w-7xl">

        <div className="mb-10 flex items-center justify-between">

          <h2 className="text-4xl font-black text-white">
            Subastas en Vivo
          </h2>

          <p className="text-orange-500">
            Actualizándose en tiempo real
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          <AuctionCard
            title="Yamaha R15"
            image="https://images.unsplash.com/photo-1558981806-ec527fa84c39"
            currentBid="$11.200.000"
            timeLeft="02:14:22"
          />

          <AuctionCard
            title="KTM Duke 200"
            image="https://images.unsplash.com/photo-1609630875171-b1321377ee65"
            currentBid="$9.500.000"
            timeLeft="00:45:10"
          />

          <AuctionCard
            title="MT-03"
            image="https://http2.mlstatic.com/D_NQ_NP_867676-MCO106555263216_022026-O.webp"
            currentBid="$18.900.000"
            timeLeft="05:20:44"
          />

        </div>

      </div>

    </section>
  );
}