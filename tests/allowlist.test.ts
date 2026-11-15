import { describe, expect, it } from "vitest";
import {
  isAllowedGitHubUserId,
  normalizeGitHubUserId,
  parseAllowedGitHubUserId,
} from "@/lib/auth/allowlist";

describe("GitHub allowlist", () => {
  it("accepts numeric IDs only", () => {
    expect(parseAllowedGitHubUserId("123456")).toBe("123456");
    expect(parseAllowedGitHubUserId(" 99 ")).toBe("99");
    expect(parseAllowedGitHubUserId("octocat")).toBeNull();
    expect(parseAllowedGitHubUserId("user@example.com")).toBeNull();
    expect(parseAllowedGitHubUserId("")).toBeNull();
    expect(parseAllowedGitHubUserId(undefined)).toBeNull();
  });

  it("normalizes numeric GitHub IDs from numbers and strings", () => {
    expect(normalizeGitHubUserId(42)).toBe("42");
    expect(normalizeGitHubUserId("42")).toBe("42");
    expect(normalizeGitHubUserId("octocat")).toBeNull();
  });

  it("denies access when the allowlist is missing or invalid", () => {
    expect(isAllowedGitHubUserId("1", undefined)).toBe(false);
    expect(isAllowedGitHubUserId("1", "")).toBe(false);
    expect(isAllowedGitHubUserId("1", "not-a-number")).toBe(false);
  });

  it("allows only the configured numeric account ID", () => {
    expect(isAllowedGitHubUserId("1001", "1001")).toBe(true);
    expect(isAllowedGitHubUserId(1001, "1001")).toBe(true);
    expect(isAllowedGitHubUserId("1002", "1001")).toBe(false);
    expect(isAllowedGitHubUserId("octocat", "1001")).toBe(false);
  });
});
