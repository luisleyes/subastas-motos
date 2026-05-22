"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  motorcycleId: string;
}

export default function LiveBids({ motorcycleId }: Props) {
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    fetchBids();

    const channel = supabase
      .channel("realtime bids")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
        },
        (payload) => {
          setBids((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBids = async () => {
    const { data } = await supabase
      .from("bids")
      .select("*")
      .eq("motorcycle_id", motorcycleId)
      .order("amount", { ascending: false });

    setBids(data || []);
  };

  return (
    <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="mb-6 text-2xl font-black text-white">
        🔥 Pujas en tiempo real
      </h2>

      <div className="space-y-4">
        {bids.length === 0 ? (
          <p className="text-zinc-500">
            Nadie ha pujando todavía
          </p>
        ) : (
          bids.map((bid) => (
            <div
              key={bid.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black p-4"
            >
              <div>
                <p className="font-bold text-white">
                  {bid.user_email}
                </p>

                <p className="text-sm text-zinc-500">
                  Nueva puja
                </p>
              </div>

              <p className="text-2xl font-black text-orange-500">
                ${Number(bid.amount).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}