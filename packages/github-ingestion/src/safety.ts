const ALLOWED_HOSTS = new Set([
  "api.github.com",
  "raw.githubusercontent.com",
  "github.com",
]);

export function isAllowedHost(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();

    // Check against allowlist
    if (!ALLOWED_HOSTS.has(hostname)) {
      return false;
    }

    // Protect against private IP ranges / localhost in hostnames
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "169.254.169.254" // Cloud metadata
    ) {
      return false;
    }

    // Check private IPv4 patterns
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

export function validateSafeUrl(urlStr: string): void {
  if (!isAllowedHost(urlStr)) {
    throw new Error(`SSRF Protection: Outbound network request to '${urlStr}' is forbidden.`);
  }
}
