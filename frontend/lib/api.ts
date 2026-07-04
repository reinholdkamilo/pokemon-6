import type { Pokemon, TeamScoreResult, TrainerProfile } from "@/types/pokemon";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function getPokemon(): Promise<Pokemon[]> {
  return fetchJson<Pokemon[]>(`${API_BASE_URL}/pokemon`);
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  const searchParams = new URLSearchParams({ query });
  return fetchJson<Pokemon[]>(`${API_BASE_URL}/pokemon/search?${searchParams}`);
}

export async function scoreTeam(
  pokemonNames: string[],
): Promise<TeamScoreResult> {
  return fetchJson<TeamScoreResult>(`${API_BASE_URL}/teams/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pokemon_names: pokemonNames }),
  });
}

export async function saveTrainerProfile(
  trainerProfile: TrainerProfile,
): Promise<TrainerProfile> {
  return fetchJson<TrainerProfile>(`${API_BASE_URL}/trainers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(trainerProfile),
  });
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { detail?: unknown };

    if (typeof body.detail === "string") {
      return body.detail;
    }

    if (Array.isArray(body.detail)) {
      return body.detail
        .map((detail) =>
          typeof detail === "object" && detail !== null && "msg" in detail
            ? String(detail.msg)
            : String(detail),
        )
        .join(" ");
    }

    return `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}
