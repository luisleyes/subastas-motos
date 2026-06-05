import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getMinimumAllowedBid,
  isAuctionActive,
  isAuctionExpired,
} from "@/lib/auction";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { motorcycleId, amount } = await req.json();

    if (!motorcycleId || amount == null) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const bidAmount = Number(amount);
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      return NextResponse.json(
        { error: "Monto inválido" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const { data: motorcycle, error: motoError } = await supabase
      .from("motorcycles")
      .select(
        "id, status, base_price, auction_end, user_id, buy_now_price"
      )
      .eq("id", motorcycleId)
      .single();

    if (motoError || !motorcycle) {
      return NextResponse.json(
        { error: "Subasta no encontrada" },
        { status: 404 }
      );
    }

    if (!isAuctionActive(motorcycle)) {
      return NextResponse.json(
        { error: "Esta subasta ya no está activa" },
        { status: 400 }
      );
    }

    if (motorcycle.user_id && motorcycle.user_id === user.id) {
      return NextResponse.json(
        { error: "No puedes pujar en tu propia moto" },
        { status: 400 }
      );
    }

    const { data: access } = await supabase
      .from("bid_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("motorcycle_id", motorcycleId)
      .eq("active", true)
      .maybeSingle();

    if (!access) {
      return NextResponse.json(
        { error: "Debes desbloquear el acceso para pujar" },
        { status: 403 }
      );
    }

    const { data: bids } = await supabase
      .from("bids")
      .select("amount, user_id")
      .eq("motorcycle_id", motorcycleId)
      .order("amount", { ascending: false });

    const minimumAllowed = getMinimumAllowedBid(
      motorcycle.base_price,
      bids || []
    );

    if (bidAmount < minimumAllowed) {
      return NextResponse.json(
        {
          error: `La puja mínima es $${minimumAllowed.toLocaleString("es-CO")}`,
          minimumAllowed,
        },
        { status: 400 }
      );
    }

    if (
      motorcycle.buy_now_price &&
      bidAmount >= motorcycle.buy_now_price
    ) {
      return NextResponse.json(
        {
          error:
            "Tu puja alcanza el precio de compra inmediata. Usa «Comprar ahora».",
        },
        { status: 400 }
      );
    }

    if (!isAuctionExpired(motorcycle.auction_end)) {
      await supabase.rpc("extend_auction_if_needed", {
        p_motorcycle_id: motorcycleId,
      });
    }

    const displayName =
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      user.id.slice(0, 8);

    const { data: newBid, error: bidError } = await supabase
      .from("bids")
      .insert([
        {
          motorcycle_id: motorcycleId,
          user_id: user.id,
          bidder_name: displayName,
          amount: bidAmount,
        },
      ])
      .select()
      .single();

    if (bidError) {
      return NextResponse.json({ error: bidError.message }, { status: 500 });
    }

    await supabase
      .from("motorcycles")
      .update({ current_price: bidAmount })
      .eq("id", motorcycleId);

    const { data: updatedMoto } = await supabase
      .from("motorcycles")
      .select("auction_end")
      .eq("id", motorcycleId)
      .single();

    return NextResponse.json({
      bid: newBid,
      auction_end: updatedMoto?.auction_end,
      minimumAllowed,
    });
  } catch (error) {
    console.error("place bid:", error);
    return NextResponse.json(
      { error: "Error al procesar la puja" },
      { status: 500 }
    );
  }
}
