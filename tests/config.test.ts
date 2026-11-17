import { describe, expect, it } from "vitest";
import { config, missingCategoryCss } from "../config";

describe("config", () => {
  it("paints a missing category in the configured colors", () => {
    const { label, light, dark } = config.appearance.missingCategory;
    expect(label).toBe("Keine Kategorie");
    expect(light).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(dark).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(missingCategoryCss()).toBe(
      `:root{--missing-category:${light}}.dark{--missing-category:${dark}}`,
    );
  });
});
