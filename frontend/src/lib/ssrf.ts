/*
  SSRF protection — validate URLs before server-side fetching.
  Blocks private IPs, metadata endpoints, non-HTTP protocols, and bypass tricks.
*/

export function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host) ||
      host.startsWith("169.254.") ||
      host.endsWith(".internal") ||
      host === "metadata.google.internal" ||
      host === "0.0.0.0" ||
      host === "[::1]" ||
      host.startsWith("[fc") || host.startsWith("[fd") ||
      host.startsWith("[fe80") ||
      host.startsWith("[::ffff:127") ||
      /^0x/i.test(host) ||
      /^\d{8,}$/.test(host) ||
      /^0+\d/.test(host)
    ) return false;
    return true;
  } catch {
    return false;
  }
}
