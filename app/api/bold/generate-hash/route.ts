import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, currency } = await req.json();

    const secretKey = process.env.BOLD_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "BOLD_SECRET_KEY no configurada" },
        { status: 500 }
      );
    }

    console.log("========== BOLD HASH ==========");
    console.log("orderId recibido:", orderId);
    console.log("amount recibido:", amount);
    console.log("currency recibida:", currency);
    console.log("secretKey:", secretKey);

    // PRUEBA TEMPORAL
    const testOrderId = "bid123";
    const testAmount = 10000;
    const testCurrency = "COP";

    const concatenated =
      `${testOrderId}${testAmount}${testCurrency}${secretKey}`;

    console.log("TEST orderId:", testOrderId);
    console.log("TEST amount:", testAmount);
    console.log("TEST currency:", testCurrency);
    console.log("concatenated:", concatenated);

    const hash = crypto
      .createHash("sha256")
      .update(concatenated)
      .digest("hex");

    console.log("hash:", hash);
    console.log("================================");

    return NextResponse.json({ hash });
  } catch (error) {
    console.error("Error generating hash:", error);

    return NextResponse.json(
      { error: "Error al generar el hash" },
      { status: 500 }
    );
  }
}