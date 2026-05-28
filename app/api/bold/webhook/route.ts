import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payment_id, status, amount } = body;

    if (status === "successful") {
      const { data: payment } = await supabase
        .from("unlock_payments")
        .select("*")
        .eq("payment_id", payment_id)
        .single();

      if (payment && payment.status === "pending") {
        // Actualizar estado del pago
        await supabase
          .from("unlock_payments")
          .update({ status: "completed" })
          .eq("payment_id", payment_id);

        // Si es tipo 'bid_access', desbloquear pujas
        if (payment.type === "bid_access") {
          await supabase.from("bid_access").upsert({
            user_id: payment.user_id,
            motorcycle_id: payment.motorcycle_id,
            active: true,
            activated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,motorcycle_id",
          });
        }
        
        // Si es tipo 'contact_access', ya está registrado en unlock_payments
        // No necesita tabla adicional
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}