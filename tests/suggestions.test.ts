import { describe, expect, it } from "vitest";
import { collectEntrySuggestions, filterTexts } from "@/lib/suggestions";

describe("entry suggestions", () => {
  it("keeps the newest spelling and separates income from expenses", () => {
    const result = collectEntrySuggestions([
      {
        typ: "ausgabe",
        bezeichnung: "Bahnfahrt München",
        konto: "4673",
        kategorieId: "Fahrtkosten",
        routeOrigin: "Heidelberg",
        routeDestination: "München Hbf",
      },
      {
        typ: "ausgabe",
        bezeichnung: "bahnfahrt münchen",
        konto: "4600",
        kategorieId: "Fahrtkosten",
      },
      {
        typ: "einnahme",
        bezeichnung: "Honorar",
        konto: "8400",
        kategorieId: "Bürobedarf",
        rechnungsnummer: "RE-9",
      },
    ]);

    expect(result.bookings).toEqual([
      {
        typ: "ausgabe",
        bezeichnung: "Bahnfahrt München",
        konto: "4673",
        kategorieId: "Fahrtkosten",
        rechnungsnummer: "",
      },
      {
        typ: "einnahme",
        bezeichnung: "Honorar",
        konto: "8400",
        kategorieId: "",
        rechnungsnummer: "RE-9",
      },
    ]);
    expect(result.expenseAccounts).toEqual(["4673", "4600"]);
    expect(result.incomeAccounts).toEqual(["8400"]);
    expect(result.invoices).toEqual(["RE-9"]);
    expect(result.origins).toEqual(["Heidelberg"]);
    expect(result.destinations).toEqual(["München Hbf"]);
  });

  it("proposes prefix matches before other matches and hides the exact text", () => {
    expect(filterTexts(["Bahnfahrt", "Taxi Bahn", "Honorar"], "bahn")).toEqual([
      "Bahnfahrt",
      "Taxi Bahn",
    ]);
    expect(filterTexts(["Bahnfahrt"], "Bahnfahrt")).toEqual([]);
    expect(filterTexts(["Bahnfahrt"], "  ")).toEqual([]);
  });
});
