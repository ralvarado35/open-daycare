import Link from "next/link";
import { SunIcon } from "@/app/components/icons";
import { familyFeedHref, loginHref } from "@/lib/nav";

/**
 * Activate account screen. Static server component without JavaScript,
 * standalone full-screen (no Sidebar / MobileNav / guard), mirroring the
 * reference comp (references/pantallas/activar-cuenta.dc.html) at 1280px.
 */
export default function ActivateAccountPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-5 py-10 md:p-[40px]">
      <div className="w-full max-w-[440px]">
        {/* Badge */}
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#f8c3a8,#f2937a)] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <SunIcon size={30} className="text-white" />
        </div>

        <h1 className="mb-[8px] font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-ink-soft">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        {/* Invitation card: Mateo */}
        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border border-line bg-white px-4 py-[14px]">
          <div className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-[#a9d9e8] font-display text-[19px] font-semibold text-[#1f7a93]">
            M
          </div>
          <div>
            <div className="text-[13px] text-ink-soft">
              Te invitaron a seguir a
            </div>
            <div className="font-display text-[17px] font-semibold text-ink">
              Mateo · Sala Soles
            </div>
          </div>
        </div>

        {/* Invitation code */}
        <label
          htmlFor="invitation-code"
          className="mb-[8px] block text-[12px] font-bold tracking-[0.7px] text-ink-soft"
        >
          CÓDIGO DE INVITACIÓN
        </label>
        <input
          id="invitation-code"
          type="text"
          defaultValue="7K4P9"
          autoComplete="off"
          className="mb-[18px] w-full rounded-[14px] border border-line bg-white px-4 py-[14px] font-display text-[18px] font-bold tracking-[3px] text-ink outline-none"
        />

        {/* Email */}
        <label
          htmlFor="activate-email"
          className="mb-[8px] block text-[12px] font-bold tracking-[0.7px] text-ink-soft"
        >
          EMAIL
        </label>
        <input
          id="activate-email"
          type="email"
          defaultValue="lucia.fernandez@gmail.com"
          autoComplete="email"
          className="mb-[18px] w-full rounded-[14px] border border-line bg-white px-4 py-[14px] text-[15px] text-ink outline-none"
        />

        {/* Create password */}
        <label
          htmlFor="activate-password"
          className="mb-[8px] block text-[12px] font-bold tracking-[0.7px] text-ink-soft"
        >
          CREAR CONTRASEÑA
        </label>
        <input
          id="activate-password"
          type="password"
          defaultValue="contraseña"
          autoComplete="new-password"
          className="mb-[18px] w-full rounded-[14px] border border-accent bg-white px-4 py-[14px] text-[15px] text-ink outline-none"
        />

        {/* Photo consent */}
        <label
          htmlFor="photo-consent"
          className="mb-[24px] flex cursor-pointer items-start gap-[12px] rounded-[14px] bg-[#fbf1d6] px-4 py-[14px]"
        >
          <input
            id="photo-consent"
            type="checkbox"
            defaultChecked
            className="mt-[1px] h-6 w-6 flex-none cursor-pointer appearance-none rounded-[8px] bg-[#5fb97e] checked:bg-[#5fb97e] checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%2220 6 9 17 4 12%22/></svg>')] checked:bg-center checked:bg-no-repeat checked:bg-[length:15px_15px]"
          />
          <span className="text-[14px] leading-[1.45] text-[#8a7234]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
            de la app.
          </span>
        </label>

        <Link
          href={familyFeedHref}
          className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#f4977e,#ee8164)] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          Activar mi cuenta
        </Link>

        <p className="mt-[22px] text-center text-[14.5px] text-ink-soft">
          ¿Ya tenés cuenta?{" "}
          <Link href={loginHref} className="font-extrabold text-[#c5503a]">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
