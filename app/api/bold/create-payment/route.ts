import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBoldPaymentLink } from "@/lib/bold";

export async function POST(req: NextRequest) {
  try {
    const { amount, description, motorcycleId, type } = await req.json();

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    // REFERENCIA ÚNICA
    const reference = `${type}-${motorcycleId}-${Date.now()}`;

    // LINK BASE DE BOLD
    const baseUrl = getBoldPaymentLink(type);

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Link de pago no configurado" },
        { status: 500 }
      );
    }

    // URL CORRECTA
    const paymentUrl = new URL(baseUrl);

    paymentUrl.searchParams.set("order-id", reference);

    paymentUrl.searchParams.set(
      "description",
      description
    );

    paymentUrl.searchParams.set(
      "redirection-url",
      `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?reference=${reference}`
    );

    // GUARDAR PAGO
    const { error: insertError } = await supabase
      .from("unlock_payments")
      .insert([
        {
          user_id: user.id,
          motorcycle_id: motorcycleId,
          payment_reference: reference,
          type,
          amount,
          status: "pending",
        },
      ]);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      approvalUrl: paymentUrl.toString(),
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error procesando pago" },
      { status: 500 }
    );
  }
}