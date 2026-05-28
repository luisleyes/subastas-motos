"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BoldCheckoutProps {
  amount: number;
  description: string;
  motorcycleId: string;
  type: "bid_access" | "contact_access";
  onSuccess?: () => void;
  buttonText: string;
  buttonClassName?: string;
}

export default function BoldCheckout({
  amount,
  description,
  motorcycleId,
  type,
  onSuccess,
  buttonText,
  buttonClassName = "w-full rounded-2xl bg-orange-500 py-4 font-black text-black hover:bg-orange-400 transition"
}: BoldCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Obtener el token de sesión
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setSessionToken(session.access_token);
      }
    };
    getSession();
  }, []);

  const handleCheckout = async () => {
    if (!sessionToken) {
      alert("Debes iniciar sesión primero");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/bold/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`, // 🔑 Enviar token
        },
        body: JSON.stringify({
          amount,
          description,
          motorcycleId,
          type,
        }),
      });

      const data = await response.json();

      if (response.ok && data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        alert(data.error || "Error al iniciar el pago");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar el pago");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || !sessionToken}
      className={buttonClassName}
    >
      {isLoading ? (
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      ) : (
        buttonText
      )}
    </button>
  );
}