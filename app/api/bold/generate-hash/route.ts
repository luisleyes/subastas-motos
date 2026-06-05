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
    console.log("orderId:", orderId);
    console.log("amount:", amount);
    console.log("currency:", currency);
    console.log("secretKey:", secretKey);

    // Bold requiere: SHA256(orderId + amount + currency + secretKey)
    const concatenated = `${orderId}${amount}${currency}${secretKey}`;

    console.log("concatenated string:", concatenated);

    const hash = crypto
      .createHash("sha256")
      .update(concatenated)
      .digest("hex");

    console.log("generated hash:", hash);
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