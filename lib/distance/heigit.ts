import {
  DistanceProviderError,
  type DistanceProvider,
  type DistanceQuery,
  type DistanceQuote,
} from "./types";

const DEFAULT_BASE_URL = "https://api.heigit.org";

type FetchLike = typeof fetch;

export type GeoPoint = {
  lon: number;
  lat: number;
  label: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function finiteCoord(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Pelias search payload from api.heigit.org/pelias/v1/search. */
export function parsePeliasSearch(payload: unknown): GeoPoint | null {
  const root = asRecord(payload);
  const features = root?.features;
  if (!Array.isArray(features) || features.length === 0) return null;
  const feature = asRecord(features[0]);
  const geometry = asRecord(feature?.geometry);
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const lon = finiteCoord(coordinates[0]);
  const lat = finiteCoord(coordinates[1]);
  if (lon == null || lat == null) return null;
  const properties = asRecord(feature?.properties);
  const label =
    typeof properties?.label === "string"
      ? properties.label
      : typeof properties?.name === "string"
        ? properties.name
        : `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  return { lon, lat, label };
}

/** Directions JSON or GeoJSON. Distance is rounded to whole metres. */
export function parseDirectionsDistanceMeters(payload: unknown): number | null {
  const root = asRecord(payload);
  const routes = root?.routes;
  const fromRoutes = Array.isArray(routes)
    ? asRecord(asRecord(routes[0])?.summary)?.distance
    : undefined;
  const features = root?.features;
  const fromFeatures = Array.isArray(features)
    ? asRecord(asRecord(asRecord(features[0])?.properties)?.summary)?.distance
    : undefined;
  const raw = fromRoutes ?? fromFeatures;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return null;
  return Math.round(raw);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new DistanceProviderError("Der Entfernungsdienst hat ungültig geantwortet.");
  }
}

function httpError(status: number): DistanceProviderError {
  if (status === 401 || status === 403) {
    return new DistanceProviderError("Der HeiGIT-API-Schlüssel wurde abgelehnt.");
  }
  if (status === 429) {
    return new DistanceProviderError(
      "Das Kontingent des Entfernungsdienstes ist aufgebraucht.",
    );
  }
  return new DistanceProviderError("Der Entfernungsdienst ist nicht erreichbar.");
}

export function createHeigitProvider(options: {
  apiKey: string;
  fetch?: FetchLike;
  baseUrl?: string;
}): DistanceProvider {
  const fetchImpl = options.fetch ?? fetch;
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const apiKey = options.apiKey.trim();

  async function request(path: string, init?: RequestInit): Promise<unknown> {
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          Authorization: apiKey,
          ...(init?.headers ?? {}),
        },
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new DistanceProviderError("Der Entfernungsdienst ist nicht erreichbar.");
    }
    if (!response.ok) throw httpError(response.status);
    return readJson(response);
  }

  async function geocode(text: string, missing: string): Promise<GeoPoint> {
    const params = new URLSearchParams({ text, size: "1" });
    const point = parsePeliasSearch(
      await request(`/pelias/v1/search?${params.toString()}`),
    );
    if (!point) throw new DistanceProviderError(missing);
    return point;
  }

  return {
    id: "heigit",
    async distance(query: DistanceQuery): Promise<DistanceQuote> {
      const [origin, destination] = await Promise.all([
        geocode(query.origin, "Start wurde nicht gefunden."),
        geocode(query.destination, "Ziel wurde nicht gefunden."),
      ]);
      const meters = parseDirectionsDistanceMeters(
        await request("/openrouteservice/v2/directions/driving-car", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coordinates: [
              [origin.lon, origin.lat],
              [destination.lon, destination.lat],
            ],
          }),
        }),
      );
      if (meters == null) {
        throw new DistanceProviderError("Keine befahrbare Strecke gefunden.");
      }
      return {
        providerId: "heigit",
        distanceMeters: meters,
        originLabel: origin.label,
        destinationLabel: destination.label,
      };
    },
  };
}
