import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font (no external requests, no layout shift).
// Fredoka is the display font (headings, avatars); Nunito is the text font.
// The CSS variables are wired into the @theme tokens in app/globals.css.
const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenDayCare",
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>{props.children}</body>
    </html>
  );
}
