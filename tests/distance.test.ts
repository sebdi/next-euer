import { describe, expect, it } from "vitest";
import { getDistanceProvider } from "@/lib/distance";
import {
  fahrtkostenCents,
  formatKilometers,
  tripDistanceMeters,
} from "@/lib/distance/fare";
import {
  createHeigitProvider,
  parseDirectionsDistanceMeters,
  parsePeliasSearch,
} from "@/lib/distance/heigit";

describe("kilometre allowance", () => {
  it("rounds metres times the per-km rate to cents", () => {
    expect(fahrtkostenCents(120_400, 30)).toBe(3_612);
    expect(fahrtkostenCents(84_320, 30)).toBe(2_530);
    expect(fahrtkostenCents(1_500, 30)).toBe(45);
  });

  it("doubles the one-way distance for a return trip", () => {
    expect(tripDistanceMeters(84_320, false)).toBe(84_320);
    expect(tripDistanceMeters(84_320, true)).toBe(168_640);
    expect(fahrtkostenCents(tripDistanceMeters(120_400, true), 30)).toBe(7_224);
  });

  it("formats kilometres with a German decimal comma", () => {
    expect(formatKilometers(84_320)).toBe("84,3 km");
    expect(formatKilometers(120_000)).toBe("120 km");
    expect(formatKilometers(1_234_500)).toBe("1.234,5 km");
  });
});

describe("HeiGIT parsing", () => {
  it("reads the first Pelias hit", () => {
    expect(
      parsePeliasSearch({
        features: [
          {
            geometry: { coordinates: [8.69, 49.41] },
            properties: { label: "Heidelberg, Deutschland" },
          },
        ],
      }),
    ).toEqual({
      lon: 8.69,
      lat: 49.41,
      label: "Heidelberg, Deutschland",
    });
    expect(parsePeliasSearch({ features: [] })).toBeNull();
  });

  it("reads directions distance from JSON and GeoJSON", () => {
    expect(
      parseDirectionsDistanceMeters({
        routes: [{ summary: { distance: 120_400.4 } }],
      }),
    ).toBe(120_400);
    expect(
      parseDirectionsDistanceMeters({
        features: [{ properties: { summary: { distance: 500.6 } } }],
      }),
    ).toBe(501);
    expect(parseDirectionsDistanceMeters({ routes: [] })).toBeNull();
  });
});

describe("HeiGIT provider", () => {
  it("geocodes both places and asks for a driving route", async () => {
    const urls: string[] = [];
    const provider = createHeigitProvider({
      apiKey: "test-key",
      fetch: async (input, init) => {
        const url = String(input);
        urls.push(url);
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("test-key");
        if (url.includes("/pelias/")) {
          const text = new URL(url).searchParams.get("text");
          const lon = text === "Heidelberg" ? 8.69 : 9.18;
          return Response.json({
            features: [
              {
                geometry: { coordinates: [lon, 49.4] },
                properties: { label: text },
              },
            ],
          });
        }
        const body = JSON.parse(String(init?.body));
        expect(body.coordinates).toEqual([
          [8.69, 49.4],
          [9.18, 49.4],
        ]);
        return Response.json({
          routes: [{ summary: { distance: 120_400.2 } }],
        });
      },
    });

    const quote = await provider.distance({
      origin: "Heidelberg",
      destination: "Stuttgart",
    });
    expect(quote).toMatchObject({
      providerId: "heigit",
      distanceMeters: 120_400,
      originLabel: "Heidelberg",
      destinationLabel: "Stuttgart",
    });
    expect(urls).toHaveLength(3);
  });

  it("reports a missing place without calling directions", async () => {
    const provider = createHeigitProvider({
      apiKey: "test-key",
      fetch: async (input) => {
        if (String(input).includes("text=Nirgendwo")) {
          return Response.json({ features: [] });
        }
        return Response.json({
          features: [
            {
              geometry: { coordinates: [8.6, 49.4] },
              properties: { label: "Heidelberg" },
            },
          ],
        });
      },
    });
    await expect(
      provider.distance({ origin: "Nirgendwo", destination: "Heidelberg" }),
    ).rejects.toThrow(/Start wurde nicht gefunden/);
  });
});

describe("distance provider selection", () => {
  it("requires a HeiGIT key and rejects unknown providers", () => {
    expect(() =>
      getDistanceProvider({} as unknown as NodeJS.ProcessEnv),
    ).toThrow(/nicht konfiguriert/);
    expect(() =>
      getDistanceProvider({
        DISTANCE_PROVIDER: "google",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/unbekannt/);
  });
});
