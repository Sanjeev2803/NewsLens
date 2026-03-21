import { describe, it, expect } from "vitest";
import { xmlParser } from "@/lib/newsSources";

describe("xmlParser", () => {
  it("parses RSS feed XML", () => {
    const xml = `<?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <title>Test Feed</title>
        <item>
          <title>Article One</title>
          <link>https://example.com/1</link>
          <description>Description of article one</description>
          <pubDate>Mon, 21 Mar 2026 10:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Article Two</title>
          <link>https://example.com/2</link>
          <description>Description of article two</description>
          <pubDate>Mon, 21 Mar 2026 09:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>`;

    const parsed = xmlParser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Article One");
    expect(items[1].link).toBe("https://example.com/2");
  });

  it("always returns items as array even with single item", () => {
    const xml = `<?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <item><title>Solo</title><link>https://example.com</link></item>
      </channel>
    </rss>`;

    const parsed = xmlParser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(1);
  });

  it("parses Atom feed entries", () => {
    const xml = `<?xml version="1.0"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>Atom Article</title>
        <link href="https://example.com/atom"/>
        <summary>Atom summary</summary>
      </entry>
    </feed>`;

    const parsed = xmlParser.parse(xml);
    const entries = parsed?.feed?.entry;
    expect(Array.isArray(entries)).toBe(true);
    expect(entries[0].title).toBe("Atom Article");
  });

  it("extracts media:thumbnail attributes", () => {
    const xml = `<?xml version="1.0"?>
    <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
      <channel>
        <item>
          <title>With Image</title>
          <media:thumbnail url="https://example.com/image.jpg" />
        </item>
      </channel>
    </rss>`;

    const parsed = xmlParser.parse(xml);
    const item = parsed?.rss?.channel?.item[0];
    expect(item["media:thumbnail"]["@_url"]).toBe("https://example.com/image.jpg");
  });
});

describe("quality filter logic", () => {
  // Test the quality criteria directly without importing the private function
  function isQualityArticle(a: { title: string; description: string; url: string }) {
    if (!a.title || a.title.trim().length < 25) return false;
    if (!a.description || a.description.trim().length < 50) return false;
    if (a.title.trim() === a.description.trim()) return false;
    const junk = /^(watch|video:|photos:|gallery:|slideshow|quiz|poll|live updates|live blog|\[removed\]|\[deleted\]|subscribe|sign up)/i;
    if (junk.test(a.title.trim())) return false;
    if (a.description.split(/\s+/).length < 8) return false;
    if (!a.url || a.url.length < 15) return false;
    return true;
  }

  it("accepts well-formed articles", () => {
    expect(isQualityArticle({
      title: "Supreme Court rules on major privacy case",
      description: "The Supreme Court has delivered a landmark ruling on digital privacy rights that could reshape how tech companies handle user data across the country.",
      url: "https://example.com/article/123",
    })).toBe(true);
  });

  it("rejects short titles", () => {
    expect(isQualityArticle({
      title: "Breaking news",
      description: "A very detailed description that is long enough to pass the filter and contains multiple words.",
      url: "https://example.com/article/123",
    })).toBe(false);
  });

  it("rejects short descriptions", () => {
    expect(isQualityArticle({
      title: "This is a sufficiently long title for the filter",
      description: "Too short",
      url: "https://example.com/article/123",
    })).toBe(false);
  });

  it("rejects clickbait titles", () => {
    expect(isQualityArticle({
      title: "Watch: Celebrity does something shocking on live TV",
      description: "A very detailed description that is long enough to pass the filter and contains multiple words.",
      url: "https://example.com/article/123",
    })).toBe(false);
  });

  it("rejects title === description", () => {
    const text = "This is a sufficiently long title for testing purposes";
    expect(isQualityArticle({
      title: text,
      description: text,
      url: "https://example.com/article/123",
    })).toBe(false);
  });

  it("rejects articles with no URL", () => {
    expect(isQualityArticle({
      title: "This is a sufficiently long title for the filter",
      description: "A very detailed description that is long enough to pass the filter and contains multiple words.",
      url: "",
    })).toBe(false);
  });
});
