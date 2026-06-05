import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { findPaymentByReference, fulfillPayment } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paymentId =
      body.payment_id || body.order_id || body["order-id"];
    const status = body.status;

    if (status !== "successful" && status !== "approved") {
      return NextResponse.json({ success: true, skipped: true });
    }

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Sin referencia" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const payment = await findPaymentByReference(supabase, paymentId);

    if (!payment || payment.status === "completed") {
      return NextResponse.json({ success: true });
    }

    await fulfillPayment(supabase, payment);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
