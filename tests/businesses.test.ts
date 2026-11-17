import { describe, expect, it } from "vitest";
import { buchungenHref, businessSlug, betriebArtLabel, profilHref } from "@/lib/business-meta";
import { resolveBusiness } from "@/lib/businesses";
import { businessIdSchema, businessInputSchema } from "@/lib/validation";
import type { Betrieb } from "@/lib/types";

const A: Betrieb = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Freiberuflich",
  art: "freiberuflich",
  anzahlBuchungen: 3,
};
const B: Betrieb = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Onlineshop",
  art: "gewerblich",
  anzahlBuchungen: 0,
};

describe("resolveBusiness", () => {
  it("prefers the URL, then the cookie, then the first business", () => {
    expect(resolveBusiness([A, B], B.id, A.id)).toBe(B);
    expect(resolveBusiness([A, B], undefined, B.id)).toBe(B);
    expect(resolveBusiness([A, B], "unbekannt", null)).toBe(A);
    expect(resolveBusiness([A, B])).toBe(A);
  });
});

describe("businessInputSchema", () => {
  it("accepts a trimmed name and a known kind", () => {
    expect(businessInputSchema.parse({ name: "  Beratung ", art: "gewerblich" })).toEqual({
      name: "Beratung",
      art: "gewerblich",
    });
  });

  it("rejects empty names, unknown kinds and extra fields", () => {
    expect(businessInputSchema.safeParse({ name: " ", art: "gewerblich" }).success).toBe(false);
    expect(businessInputSchema.safeParse({ name: "X", art: "gmbh" }).success).toBe(false);
    expect(
      businessInputSchema.safeParse({ name: "X", art: "gewerblich", id: "1" }).success,
    ).toBe(false);
    expect(businessInputSchema.safeParse({ name: "x".repeat(61), art: "gewerblich" }).success).toBe(false);
  });

  it("validates business ids as UUIDs", () => {
    expect(businessIdSchema.safeParse(A.id).success).toBe(true);
    expect(businessIdSchema.safeParse("freiberuflich").success).toBe(false);
  });
});

describe("business labels", () => {
  it("builds file-name friendly slugs", () => {
    expect(businessSlug("Büro Müller & Söhne")).toBe("buero-mueller-soehne");
    expect(businessSlug("  Café  ")).toBe("cafe");
    expect(businessSlug("!!!")).toBe("betrieb");
  });

  it("keeps the same business and year in both headers", () => {
    expect(buchungenHref(A.id, 2026)).toBe(`/?betrieb=${A.id}&jahr=2026`);
    expect(profilHref(A.id, 2026)).toBe(`/profil?betrieb=${A.id}&jahr=2026`);
    expect(buchungenHref(undefined, 2026)).toBe("/?jahr=2026");
  });

  it("labels both kinds", () => {
    expect(betriebArtLabel("freiberuflich")).toBe("Freiberuflich");
    expect(betriebArtLabel("gewerblich")).toBe("Gewerblich");
  });
});
