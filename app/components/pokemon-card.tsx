"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const POKEMON_API_URL = "https://pokeapi.co/api/v2/pokemon";
const FIRST_POKEMON_ID = 1;
const LAST_POKEMON_ID = 1025;

type PokemonApiResponse = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: { name: string } }[];
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
    };
  };
};

type Pokemon = {
  id: number;
  name: string;
  types: string[];
  imageUrl: string | null;
  heightInMeters: number;
  weightInKilograms: number;
};

type LoadStatus = "loading" | "success" | "error";

/** Spanish label + warm palette chip for every PokeAPI type name. */
const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  normal: { label: "Normal", className: "bg-[#efe8d8] text-[#8a7d68]" },
  fire: { label: "Fuego", className: "bg-[#ffe0d0] text-[#c2521f]" },
  water: { label: "Agua", className: "bg-[#d7e8ff] text-[#2f6bb0]" },
  electric: { label: "Eléctrico", className: "bg-[#fff3c4] text-[#a08000]" },
  grass: { label: "Planta", className: "bg-[#dcefcd] text-[#4a7c2f]" },
  ice: { label: "Hielo", className: "bg-[#d9f2f0] text-[#2f8580]" },
  fighting: { label: "Lucha", className: "bg-[#f7d5cc] text-[#a63d24]" },
  poison: { label: "Veneno", className: "bg-[#ecd7f2] text-[#7b3f9c]" },
  ground: { label: "Tierra", className: "bg-[#efe0c4] text-[#8a6428]" },
  flying: { label: "Volador", className: "bg-[#e3e6f7] text-[#5b64a8]" },
  psychic: { label: "Psíquico", className: "bg-[#ffd9e4] text-[#b03a63]" },
  bug: { label: "Bicho", className: "bg-[#e6eec6] text-[#6b7f22]" },
  rock: { label: "Roca", className: "bg-[#e8e0c4] text-[#7d6a37]" },
  ghost: { label: "Fantasma", className: "bg-[#e0dcf0] text-[#574a91]" },
  dragon: { label: "Dragón", className: "bg-[#dbd9ff] text-[#4036a8]" },
  dark: { label: "Siniestro", className: "bg-[#e2d8d0] text-[#5c4a3d]" },
  steel: { label: "Acero", className: "bg-[#e2e6e9] text-[#5c6a73]" },
  fairy: { label: "Hada", className: "bg-[#ffe2ee] text-[#b0467d]" },
};

const FALLBACK_TYPE_STYLE = { label: "", className: "bg-line-soft text-ink-soft" };

function toPokemon(data: PokemonApiResponse): Pokemon {
  return {
    id: data.id,
    name: data.name,
    types: [...data.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name),
    imageUrl: data.sprites.other?.["official-artwork"]?.front_default ?? data.sprites.front_default,
    heightInMeters: data.height / 10,
    weightInKilograms: data.weight / 10,
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMetric(value: number, unit: string) {
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)} ${unit}`;
}

/**
 * Fetches the current Pokémon from PokeAPI on the client, renders its artwork
 * and lets the user walk through the Pokédex with the previous/next buttons.
 * Parent pages stay Server Components and only mount this component
 * (see app/pokemon/page.tsx).
 */
export function PokemonCard() {
  const [pokemonId, setPokemonId] = useState(FIRST_POKEMON_ID);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPokemon() {
      setStatus("loading");

      try {
        const response = await fetch(`${POKEMON_API_URL}/${pokemonId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Pokémon request failed with status ${response.status}`);
        }

        const data: PokemonApiResponse = await response.json();
        setPokemon(toPokemon(data));
        setStatus("success");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("error");
      }
    }

    void loadPokemon();

    return () => controller.abort();
  }, [pokemonId, reloadToken]);

  const canGoBack = pokemonId > FIRST_POKEMON_ID;
  const canGoForward = pokemonId < LAST_POKEMON_ID;
  const isBusy = status === "loading";

  return (
    <section
      aria-labelledby="pokemon-heading"
      aria-busy={isBusy}
      className="w-full rounded-[22px] border border-line bg-card p-6 shadow-[0_10px_30px_-20px_rgba(120,90,60,0.5)]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="pokemon-heading"
          className="text-[12.5px] font-extrabold tracking-[0.8px] text-accent-dark"
        >
          POKÉMON ACTUAL
        </h2>
        <span className="text-[12px] font-extrabold tracking-[0.6px] text-ink-faint">
          #{String(pokemonId).padStart(4, "0")}
        </span>
      </div>

      <div className="mt-4 flex min-h-[232px] flex-col items-center justify-center rounded-[16px] bg-cream/60 px-4 py-5">
        {status === "error" ? (
          <div className="text-center">
            <p className="font-display text-[18px] font-semibold text-ink">
              No pudimos cargar el Pokémon
            </p>
            <p className="mt-1 text-[13.5px] text-ink-soft">
              Revisa tu conexión e inténtalo de nuevo.
            </p>
            <button
              type="button"
              onClick={() => setReloadToken((current) => current + 1)}
              className="mt-4 cursor-pointer rounded-[12px] bg-gradient-to-b from-accent to-accent-strong px-4 py-2 font-display text-[14.5px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {pokemon?.imageUrl ? (
              <Image
                key={pokemon.id}
                src={pokemon.imageUrl}
                alt={`Ilustración de ${capitalize(pokemon.name)}`}
                width={200}
                height={200}
                loading="eager"
                className={`h-[172px] w-[172px] object-contain transition-opacity ${
                  isBusy ? "opacity-40" : "opacity-100"
                }`}
              />
            ) : (
              <div
                aria-hidden="true"
                className={`flex h-[172px] w-[172px] items-center justify-center rounded-full bg-line-soft font-display text-[42px] text-ink-faint transition-opacity ${
                  isBusy ? "opacity-40" : "opacity-100"
                }`}
              >
                ?
              </div>
            )}

            <p
              aria-live="polite"
              className="mt-1 font-display text-[26px] font-semibold leading-none text-ink"
            >
              {pokemon ? capitalize(pokemon.name) : "Cargando…"}
            </p>

            {pokemon ? (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-[6px]">
                {pokemon.types.map((type) => {
                  const style = TYPE_STYLES[type] ?? FALLBACK_TYPE_STYLE;

                  return (
                    <span
                      key={type}
                      className={`rounded-full px-[10px] py-[3px] text-[12px] font-extrabold tracking-[0.3px] ${style.className}`}
                    >
                      {style.label || capitalize(type)}
                    </span>
                  );
                })}
              </div>
            ) : null}

            {pokemon ? (
              <p className="mt-3 text-[13px] font-semibold text-ink-soft">
                {formatMetric(pokemon.heightInMeters, "m")} · {formatMetric(pokemon.weightInKilograms, "kg")}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-5 flex items-center gap-[10px]">
        <button
          type="button"
          onClick={() => setPokemonId((current) => Math.max(FIRST_POKEMON_ID, current - 1))}
          disabled={!canGoBack || isBusy}
          className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-[6px] rounded-[12px] border border-line bg-cream font-display text-[15px] font-semibold text-ink-soft transition-colors hover:border-accent-soft hover:bg-accent-soft hover:text-accent-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-cream disabled:hover:text-ink-soft"
        >
          <span aria-hidden="true">←</span>
          Anterior
        </button>

        <button
          type="button"
          onClick={() => setPokemonId((current) => Math.min(LAST_POKEMON_ID, current + 1))}
          disabled={!canGoForward || isBusy}
          className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-[6px] rounded-[12px] bg-gradient-to-b from-accent to-accent-strong font-display text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
