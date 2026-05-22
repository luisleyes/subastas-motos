type Props = {
  title: string;
  image: string;
  currentBid: string;
  timeLeft: string;
  featured?: boolean;  // Nueva prop opcional para destacar
};

export default function AuctionCard({
  title,
  image,
  currentBid,
  timeLeft,
  featured = false,  // Por defecto no es destacada
}: Props) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10">

      <div className="relative">

        <img
          src={image}
          alt={title}
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Badge HOT (izquierda) */}
        <div className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white shadow-lg">
          🔥 HOT
        </div>

        {/* Badge DESTACADA (derecha) - SOLO SI featured ES TRUE */}
        {featured && (
          <div className="absolute right-4 top-4 z-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-xs font-black text-black shadow-lg">
            ⭐ DESTACADA
          </div>
        )}

        {/* Badge de tiempo (esquina inferior) */}
        <div className="absolute bottom-4 right-4 rounded-full bg-black/80 backdrop-blur-sm px-3 py-1 text-sm font-bold text-white">
          ⏱️ {timeLeft}
        </div>

      </div>

      <div className="p-5">

        <h2 className="text-2xl font-black text-white">
          {title}
        </h2>

        <p className="mt-2 text-zinc-400">
          Puja actual
        </p>

        <h3 className="mt-1 text-3xl font-black text-orange-500">
          {currentBid}
        </h3>

        <button className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 py-4 font-bold text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/25">
          🚀 PUJAR AHORA
        </button>

      </div>

    </div>
  );
}