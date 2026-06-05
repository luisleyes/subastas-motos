import type { SupabaseClient } from "@supabase/supabase-js";

export type UnlockPayment = {
  id: string;
  user_id: string;
  motorcycle_id: string;
  type: string;
  amount: number;
  status: string;
  payment_id?: string | null;
  payment_reference?: string | null;
};

export async function findPaymentByReference(
  supabase: SupabaseClient,
  reference: string
) {
  const { data: byId } = await supabase
    .from("unlock_payments")
    .select("*")
    .eq("payment_id", reference)
    .maybeSingle();

  if (byId) return byId as UnlockPayment;

  const { data: byRef } = await supabase
    .from("unlock_payments")
    .select("*")
    .eq("payment_reference", reference)
    .maybeSingle();

  return (byRef as UnlockPayment) || null;
}

export async function fulfillPayment(
  supabase: SupabaseClient,
  payment: UnlockPayment
): Promise<{ type: string; motorcycleId: string }> {
  if (payment.status !== "completed") {
    const { error: updateError } = await supabase
      .from("unlock_payments")
      .update({ status: "completed" })
      .eq("id", payment.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  if (payment.type === "bid_access") {
    const { error: accessError } = await supabase.from("bid_access").upsert(
      {
        user_id: payment.user_id,
        motorcycle_id: payment.motorcycle_id,
        active: true,
        activated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,motorcycle_id" }
    );

    if (accessError) {
      throw new Error(accessError.message);
    }
  }

  if (payment.type === "buy_now") {
    const { data: moto, error: motoError } = await supabase
      .from("motorcycles")
      .select("status, user_id")
      .eq("id", payment.motorcycle_id)
      .single();

    if (motoError || !moto) {
      throw new Error("Moto no encontrada");
    }

    if (moto.status === "active") {
      const { error: soldError } = await supabase
        .from("motorcycles")
        .update({
          status: "sold",
          winner_id: payment.user_id,
          sold_price: payment.amount,
          sold_at: new Date().toISOString(),
          current_price: payment.amount,
          auction_end: new Date().toISOString(),
        })
        .eq("id", payment.motorcycle_id)
        .eq("status", "active");

      if (soldError) {
        throw new Error(soldError.message);
      }
    }

    await supabase.from("bid_access").upsert(
      {
        user_id: payment.user_id,
        motorcycle_id: payment.motorcycle_id,
        active: true,
        activated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,motorcycle_id" }
    );
  }

  return {
    type: payment.type,
    motorcycleId: payment.motorcycle_id,
  };
}
