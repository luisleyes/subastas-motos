import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { findPaymentByReference, fulfillPayment } from "@/lib/payments";

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
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json(
        { error: "Referencia de pago requerida" },
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

    const payment = await findPaymentByReference(supabase, reference);

    if (!payment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    if (payment.user_id !== user.id) {
      return NextResponse.json({ error: "Pago no autorizado" }, { status: 403 });
    }

    const result = await fulfillPayment(supabase, payment);

    return NextResponse.json({
      success: true,
      type: result.type,
      motorcycleId: result.motorcycleId,
    });
  } catch (error) {
    console.error("fulfill payment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al confirmar pago",
      },
      { status: 500 }
    );
  }
}
