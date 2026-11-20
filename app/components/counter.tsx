"use client";

import { useState } from "react";

type CounterProps = {
  initialValue?: number;
  step?: number;
};

/**
 * Minimal client counter: renders the current value on screen and lets the
 * user bump it up or down. Parent pages stay Server Components and just mount
 * this component (see app/counter/page.tsx).
 */
export function Counter({ initialValue = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initialValue);
  const isInitial = count === initialValue;

  return (
    <section
      aria-labelledby="counter-heading"
      className="w-full rounded-[22px] border border-line bg-card p-6 shadow-[0_10px_30px_-20px_rgba(120,90,60,0.5)]"
    >
      <h2
        id="counter-heading"
        className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent-dark"
      >
        VALOR ACTUAL
      </h2>

      <output
        aria-live="polite"
        className="block font-display text-[56px] font-semibold leading-none text-ink"
      >
        {count}
      </output>

      <div className="mt-6 flex items-center gap-[10px]">
        <button
          type="button"
          onClick={() => setCount((current) => current - step)}
          aria-label={`Restar ${step}`}
          className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-[12px] border border-line bg-cream font-display text-[22px] leading-none text-ink-soft transition-colors hover:border-accent-soft hover:bg-accent-soft hover:text-accent-deep"
        >
          −
        </button>

        <button
          type="button"
          onClick={() => setCount((current) => current + step)}
          aria-label={`Sumar ${step}`}
          className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-[12px] bg-gradient-to-b from-accent to-accent-strong font-display text-[16px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          +{step}
        </button>

        <button
          type="button"
          onClick={() => setCount(initialValue)}
          disabled={isInitial}
          aria-label="Reiniciar contador"
          className="flex h-11 flex-none cursor-pointer items-center justify-center rounded-[12px] border border-line px-[14px] text-[13.5px] font-extrabold text-ink-soft transition-colors hover:border-accent-soft hover:text-accent-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
        >
          Reiniciar
        </button>
      </div>
    </section>
  );
}
