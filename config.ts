/**
 * App-wide settings. Values here are the source of truth for behavior and
 * appearance that should be changed in one place.
 */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function color(value: string): string {
  if (!HEX_COLOR.test(value)) {
    throw new Error(`Color must be #RRGGBB, received ${value}.`);
  }
  return value;
}

export const config = {
  appearance: {
    /**
     * Expense bookings without a category. Shown in the table and the phone list.
     * `light` and `dark` are the hint colors for the two themes.
     */
    missingCategory: {
      label: "Keine Kategorie",
      light: color("#c05621"),
      dark: color("#f0a05a"),
    },
  },
} as const;

/** CSS custom properties consumed by the missing-category hint. */
export function missingCategoryCss(): string {
  const { light, dark } = config.appearance.missingCategory;
  return `:root{--missing-category:${light}}.dark{--missing-category:${dark}}`;
}
