"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "./actions";
import { SunIcon } from "@/app/components/icons";
import { activateAccountHref, forgotPasswordHref } from "@/lib/nav";

/**
 * Login screen. Client component that submits email + password to the
 * `signIn` Server Action against Supabase Auth. On success it redirects to
 * `/`; on failure it shows an on-screen error message.
 *
 * Mirrors the reference comp (references/pantallas/login.dc.html) at 1280px:
 * gradient brand panel (left) + form side (right), EMAIL / CONTRASEÑA labels,
 * "Iniciar sesión" CTA, "¿Olvidaste tu contraseña?" and "Activá tu cuenta"
 * links. The Personal/Familia toggle is intentionally omitted (SPEC 03).
 */
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await signIn(formData);

    // `signIn` calls `redirect("/")` on success (navigation happens
    // automatically, so we never reach here). On failure it returns
    // `{ error }`, which we show on screen.
    if (result && typeof result === "object" && "error" in result) {
      setError(String((result as { error: string }).error));
    }
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-cream md:grid-cols-[1.05fr_1fr]">
      {/* Brand panel: gradient + logo + headline */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#f6a98e_0%,#f2937a_45%,#ec7e62_100%)] px-6 py-8 text-white md:px-[60px] md:py-[56px]">
        <div className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/12" />
        <div className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/10" />

        <div className="relative flex items-center gap-[13px]">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/22">
            <SunIcon size={26} className="text-white" />
          </div>
          <span className="font-display text-[21px] font-semibold tracking-[0.5px]">
            OpenDayCare
          </span>
        </div>

        <div className="relative">
          <h1 className="mb-[18px] font-display text-[30px] font-semibold leading-[1.12] md:text-[42px]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="hidden max-w-[430px] text-[17px] leading-[1.6] text-white/92 md:block">
            Publicá momentos, gestioná las salas y mantené a las familias cerca,
            desde un solo lugar.
          </p>
        </div>

        <p className="relative hidden text-[14px] text-white/90 md:block">
          🌿 Guardería Sala Soles
        </p>
      </section>

      {/* Form side */}
      <section className="flex items-center justify-center px-5 py-10 md:p-10">
        <div className="w-full max-w-[392px]">
          <h2 className="mb-[6px] font-display text-[30px] font-semibold text-ink">
            Iniciar sesión
          </h2>
          <p className="mb-[28px] text-[15px] text-ink-soft">
            Ingresá para ver el día de hoy.
          </p>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="login-email"
              className="mb-[8px] block text-[12px] font-bold tracking-[0.7px] text-ink-soft"
            >
              EMAIL
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              defaultValue="caro@opendaycare.com"
              autoComplete="email"
              required
              className="mb-[18px] w-full rounded-[14px] border border-line bg-white px-4 py-[14px] text-[15px] text-ink outline-none"
            />

            <label
              htmlFor="login-password"
              className="mb-[8px] block text-[12px] font-bold tracking-[0.7px] text-ink-soft"
            >
              CONTRASEÑA
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="mb-[10px] w-full rounded-[14px] border border-line bg-white px-4 py-[14px] text-[15px] text-ink outline-none placeholder:text-[#b6a99b]"
            />

            {error && (
              <p className="mb-[12px] text-[12.5px] text-center text-[#c5503a]">
                {error}
              </p>
            )}

            <div className="mb-[20px] text-right">
              <Link
                href={forgotPasswordHref}
                className="text-[13.5px] font-bold text-[#c5503a]"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#f4977e,#ee8164)] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
            >
              Iniciar sesión
            </button>

            <p className="mt-[24px] text-center text-[14.5px] text-ink-soft">
              ¿Te invitó la guardería?{" "}
              <Link
                href={activateAccountHref}
                className="font-extrabold text-[#c5503a]"
              >
                Activá tu cuenta
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
