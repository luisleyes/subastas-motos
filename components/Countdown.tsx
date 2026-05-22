"use client";

import { useEffect, useState } from "react";

export default function Countdown({
  endDate,
}: {
  endDate: string;
}) {

  const calculateTimeLeft = () => {

    const difference =
      new Date(endDate).getTime() -
      new Date().getTime();

    if (difference <= 0) {

      return null;
    }

    return {

      hours: Math.floor(
        (difference / (1000 * 60 * 60)) % 24
      ),

      minutes: Math.floor(
        (difference / (1000 * 60)) % 60
      ),

      seconds: Math.floor(
        (difference / 1000) % 60
      ),

    };
  };

  const [timeLeft, setTimeLeft] =
    useState(calculateTimeLeft());

  useEffect(() => {

    const timer = setInterval(() => {

      setTimeLeft(calculateTimeLeft());

    }, 1000);

    return () => clearInterval(timer);

  }, []);

  if (!timeLeft) {

    return (

      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8">

        <h3 className="text-4xl font-black text-red-500">
          SUBASTA FINALIZADA
        </h3>

      </div>

    );
  }

  return (

    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">

      <p className="mb-2 text-sm uppercase tracking-widest text-zinc-500">
        Termina en
      </p>

      <h3 className="text-5xl font-black text-white">

        {
          String(timeLeft.hours)
            .padStart(2, "0")
        }h {" "}

        {
          String(timeLeft.minutes)
            .padStart(2, "0")
        }m {" "}

        {
          String(timeLeft.seconds)
            .padStart(2, "0")
        }s

      </h3>

    </div>
  );
}