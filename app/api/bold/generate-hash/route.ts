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
    
    // Concatenar: Identificador + Monto + Divisa + LlaveSecreta
    const concatenated = `${orderId}${amount}${currency}${secretKey}`;
    
    // Generar hash SHA256
    const hash = crypto.createHash("sha256").update(concatenated).digest("hex");
    
    return NextResponse.json({ hash });
  } catch (error) {
    console.error("Error generating hash:", error);
    return NextResponse.json(
      { error: "Error al generar el hash" },
      { status: 500 }
    );
  }
}