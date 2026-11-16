import { createHeigitProvider } from "./heigit";
import { DistanceProviderError, type DistanceProvider } from "./types";

export function getDistanceProvider(
  env: NodeJS.ProcessEnv = process.env,
): DistanceProvider {
  const id = (env.DISTANCE_PROVIDER ?? "heigit").trim() || "heigit";
  if (id === "heigit") {
    const apiKey = env.HEIGIT_API_KEY?.trim() ?? "";
    if (!apiKey) {
      throw new DistanceProviderError("Der Entfernungsdienst ist nicht konfiguriert.");
    }
    return createHeigitProvider({ apiKey });
  }
  throw new DistanceProviderError("Der konfigurierte Entfernungsdienst ist unbekannt.");
}

export { DistanceProviderError };
export type { DistanceProvider, DistanceQuery, DistanceQuote } from "./types";
