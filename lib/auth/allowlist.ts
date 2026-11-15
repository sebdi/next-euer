/**
 * Single-deployment allowlist: only the numeric GitHub account ID may sign in.
 * Usernames and email addresses are never used for authorization.
 */
export function parseAllowedGitHubUserId(
  raw: string | undefined | null,
): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return trimmed;
}

export function normalizeGitHubUserId(id: unknown): string | null {
  if (id == null) return null;
  const candidate = typeof id === "number" ? String(id) : String(id).trim();
  if (!/^\d+$/.test(candidate)) return null;
  return candidate;
}

export function isAllowedGitHubUserId(
  id: unknown,
  allowedRaw: string | undefined | null = process.env.GITHUB_ALLOWED_USER_ID,
): boolean {
  const allowed = parseAllowedGitHubUserId(allowedRaw);
  const candidate = normalizeGitHubUserId(id);
  if (allowed == null || candidate == null) return false;
  return candidate === allowed;
}
