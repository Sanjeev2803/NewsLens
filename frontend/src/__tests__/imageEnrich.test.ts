import { describe, it, expect, vi } from "vitest";
import { enrichArticleImages } from "@/lib/imageEnrich";

// Mock fetch globally to avoid real HTTP calls
const originalFetch = globalThis.fetch;

describe("enrichArticleImages", () => {
  it("returns articles unchanged when all have images", async () => {
    const articles = [
      { title: "A", image: "https://example.com/unique1.jpg", url: "https://example.com/1" },
      { title: "B", image: "https://example.com/unique2.jpg", url: "https://example.com/2" },
    ];
    const result = await enrichArticleImages(articles);
    expect(result[0].image).toBe("https://example.com/unique1.jpg");
    expect(result[1].image).toBe("https://example.com/unique2.jpg");
  });

  it("detects duplicate images as logos", async () => {
    // Mock fetch to return nothing (force null)
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network"));

    const articles = [
      { title: "A", image: "https://example.com/logo.png", url: "https://example.com/1" },
      { title: "B", image: "https://example.com/logo.png", url: "https://example.com/2" },
      { title: "C", image: "https://example.com/unique.jpg", url: "https://example.com/3" },
    ];
    const result = await enrichArticleImages(articles);
    // Unique image should be preserved
    expect(result[2].image).toBe("https://example.com/unique.jpg");
    // Duplicates should be nullified (fetch fails so no replacement)
    expect(result[0].image).toBeNull();
    expect(result[1].image).toBeNull();

    globalThis.fetch = originalFetch;
  });

  it("handles empty article list", async () => {
    const result = await enrichArticleImages([]);
    expect(result).toEqual([]);
  });

  it("handles articles with null images", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network"));

    const articles = [
      { title: "No image article title here", image: null, url: "https://example.com/1" },
    ];
    const result = await enrichArticleImages(articles);
    expect(result).toHaveLength(1);
    // Image stays null when scraping fails
    expect(result[0].image).toBeNull();

    globalThis.fetch = originalFetch;
  });

  it("detects logo URLs in image field", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network"));

    const articles = [
      { title: "A", image: "https://example.com/favicon.ico", url: "https://example.com/1" },
      { title: "B", image: "https://example.com/site-logo.png", url: "https://example.com/2" },
    ];
    const result = await enrichArticleImages(articles);
    // Logo patterns should trigger re-scrape attempt (which fails → null)
    expect(result[0].image).toBeNull();
    expect(result[1].image).toBeNull();

    globalThis.fetch = originalFetch;
  });
});
