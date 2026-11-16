export type DistanceQuery = {
  origin: string;
  destination: string;
};

export type DistanceQuote = {
  providerId: string;
  distanceMeters: number;
  originLabel: string;
  destinationLabel: string;
};

/** Address-to-address distance. Implementations hide geocoding and routing. */
export interface DistanceProvider {
  readonly id: string;
  distance(query: DistanceQuery): Promise<DistanceQuote>;
}

export class DistanceProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DistanceProviderError";
  }
}
