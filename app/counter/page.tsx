import type { Metadata } from "next";
import { Counter } from "@/app/components/counter";



export const metadata: Metadata = {
  title: "Contador · OpenDayCare",
}



/**
 * Demo route for the Counter client component. The page itself stays a Server
 * Component; only the counter ships to the browser as JS.
 */
export default function CounterPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-[380px]">
        <p className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent-dark">
          DEMO
        </p>
        <h1 className="mb-5 font-display text-[30px] font-semibold text-ink">
          Contador
        </h1>
        <Counter initialValue={0} step={1} />
      </div>
    </main>
  );
}
