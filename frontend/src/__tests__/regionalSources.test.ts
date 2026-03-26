import { describe, it, expect } from "vitest";
import {
  LANGUAGE_STATE_MAP,
  REGIONAL_FEEDS,
  getGeoForCountry,
  getRegionalGeo,
} from "@/lib/regionalSources";

describe("LANGUAGE_STATE_MAP", () => {
  it("has mappings for all 10 Indian languages", () => {
    const expected = ["te", "ta", "hi", "bn", "mr", "kn", "ml", "gu", "pa", "ur"];
    for (const lang of expected) {
      expect(LANGUAGE_STATE_MAP[lang]).toBeDefined();
      expect(LANGUAGE_STATE_MAP[lang].states.length).toBeGreaterThan(0);
      expect(LANGUAGE_STATE_MAP[lang].geoCode).toMatch(/^IN-/);
    }
  });

  it("maps Tamil to Tamil Nadu", () => {
    expect(LANGUAGE_STATE_MAP.ta.states).toContain("Tamil Nadu");
    expect(LANGUAGE_STATE_MAP.ta.geoCode).toBe("IN-TN");
  });

  it("maps Telugu to AP and Telangana", () => {
    expect(LANGUAGE_STATE_MAP.te.states).toContain("Andhra Pradesh");
    expect(LANGUAGE_STATE_MAP.te.states).toContain("Telangana");
  });
});

describe("REGIONAL_FEEDS", () => {
  it("has feeds for every language in LANGUAGE_STATE_MAP", () => {
    for (const lang of Object.keys(LANGUAGE_STATE_MAP)) {
      expect(REGIONAL_FEEDS[lang]).toBeDefined();
      expect(REGIONAL_FEEDS[lang].length).toBeGreaterThan(0);
    }
  });

  it("each feed has required fields", () => {
    for (const feeds of Object.values(REGIONAL_FEEDS)) {
      for (const feed of feeds) {
        expect(feed.name).toBeTruthy();
        expect(feed.url).toMatch(/^https?:\/\//);
        expect(feed.state).toBeTruthy();
      }
    }
  });
});

describe("getGeoForCountry", () => {
  it("returns correct geo codes for known countries", () => {
    expect(getGeoForCountry("in")).toBe("IN");
    expect(getGeoForCountry("us")).toBe("US");
    expect(getGeoForCountry("gb")).toBe("GB");
    expect(getGeoForCountry("jp")).toBe("JP");
  });

  it("defaults to IN for unknown countries", () => {
    expect(getGeoForCountry("xx")).toBe("IN");
    expect(getGeoForCountry("")).toBe("IN");
  });
});

describe("getRegionalGeo", () => {
  it("returns state-level geo for Indian regional languages", () => {
    expect(getRegionalGeo("ta", "in")).toBe("IN-TN");
    expect(getRegionalGeo("te", "in")).toBe("IN-TG");
    expect(getRegionalGeo("hi", "in")).toBe("IN-DL");
    expect(getRegionalGeo("kn", "in")).toBe("IN-KA");
  });

  it("returns country-level geo for English in India", () => {
    expect(getRegionalGeo("en", "in")).toBe("IN");
  });

  it("returns country-level geo for non-Indian countries", () => {
    expect(getRegionalGeo("en", "us")).toBe("US");
    expect(getRegionalGeo("ta", "us")).toBe("US"); // Tamil user in US gets US trends
  });
});
