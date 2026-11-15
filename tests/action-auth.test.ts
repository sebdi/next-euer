import { describe, expect, it } from "vitest";
import { USER_ERROR } from "@/lib/validation";
import { actionError } from "@/lib/action-result";

describe("unauthorized access handling", () => {
  it("returns a generic unauthorized result without stack traces", () => {
    const result = actionError(USER_ERROR.unauthorized);
    expect(result).toEqual({ ok: false, error: "Nicht angemeldet." });
    expect(JSON.stringify(result)).not.toMatch(/at /);
  });
});
