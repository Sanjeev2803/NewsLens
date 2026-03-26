import { describe, it, expect } from "vitest";
import { isSafeUrl } from "@/lib/ssrf";

describe("SSRF protection — isSafeUrl", () => {
  // ── ALLOWED ──
  it("allows valid HTTPS URLs", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("https://news.bbc.co.uk/article/123")).toBe(true);
  });

  it("allows valid HTTP URLs", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  // ── BLOCKED: Localhost ──
  it("blocks localhost", () => {
    expect(isSafeUrl("http://localhost")).toBe(false);
    expect(isSafeUrl("http://localhost:3000")).toBe(false);
    expect(isSafeUrl("https://localhost/admin")).toBe(false);
  });

  it("blocks 127.x.x.x loopback", () => {
    expect(isSafeUrl("http://127.0.0.1")).toBe(false);
    expect(isSafeUrl("http://127.0.0.1:8080")).toBe(false);
    expect(isSafeUrl("http://127.255.255.255")).toBe(false);
  });

  it("blocks IPv6 loopback", () => {
    expect(isSafeUrl("http://[::1]")).toBe(false);
  });

  // ── BLOCKED: Private networks ──
  it("blocks 10.x.x.x private range", () => {
    expect(isSafeUrl("http://10.0.0.1")).toBe(false);
    expect(isSafeUrl("http://10.255.255.255")).toBe(false);
  });

  it("blocks 192.168.x.x private range", () => {
    expect(isSafeUrl("http://192.168.0.1")).toBe(false);
    expect(isSafeUrl("http://192.168.1.100")).toBe(false);
  });

  it("blocks 172.16-31.x.x private range", () => {
    expect(isSafeUrl("http://172.16.0.1")).toBe(false);
    expect(isSafeUrl("http://172.31.255.255")).toBe(false);
  });

  // ── BLOCKED: Link-local / metadata ──
  it("blocks link-local addresses (169.254.x.x)", () => {
    expect(isSafeUrl("http://169.254.169.254")).toBe(false);
  });

  it("blocks cloud metadata endpoints", () => {
    expect(isSafeUrl("http://metadata.google.internal")).toBe(false);
  });

  it("blocks .internal domains", () => {
    expect(isSafeUrl("http://service.internal")).toBe(false);
  });

  // ── BLOCKED: Non-HTTP protocols ──
  it("blocks file:// protocol", () => {
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });

  it("blocks javascript: protocol", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  it("blocks ftp: protocol", () => {
    expect(isSafeUrl("ftp://example.com")).toBe(false);
  });

  // ── BLOCKED: Bypass tricks ──
  it("blocks 0.0.0.0", () => {
    expect(isSafeUrl("http://0.0.0.0")).toBe(false);
  });

  it("blocks hex-encoded IPs", () => {
    expect(isSafeUrl("http://0x7f000001")).toBe(false);
  });

  it("blocks octal-encoded IPs", () => {
    expect(isSafeUrl("http://0177.0.0.1")).toBe(false);
  });

  // ── BLOCKED: Invalid input ──
  it("blocks empty string", () => {
    expect(isSafeUrl("")).toBe(false);
  });

  it("blocks malformed URLs", () => {
    expect(isSafeUrl("not-a-url")).toBe(false);
    expect(isSafeUrl("://missing-protocol")).toBe(false);
  });

  // ── BLOCKED: IPv6 private ──
  it("blocks IPv6 unique local (fc/fd)", () => {
    expect(isSafeUrl("http://[fc00::1]")).toBe(false);
    expect(isSafeUrl("http://[fd12:3456::1]")).toBe(false);
  });

  it("blocks IPv6 link-local (fe80)", () => {
    expect(isSafeUrl("http://[fe80::1]")).toBe(false);
  });
});
