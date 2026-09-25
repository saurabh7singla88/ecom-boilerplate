import { describe, expect, it } from "vitest";
import { catalogHref, parseCatalogParams } from "./search-params";

describe("parseCatalogParams", () => {
  it("applies defaults", () => {
    expect(parseCatalogParams({})).toEqual({ page: 1, limit: 12, sort: "newest" });
  });

  it("reads the first value of repeated params", () => {
    expect(parseCatalogParams({ category: ["apparel", "home"], page: "2" })).toMatchObject({
      category: "apparel",
      page: 2,
    });
  });

  it("falls back to defaults when params are invalid", () => {
    expect(parseCatalogParams({ sort: "cheapest" })).toEqual({
      page: 1,
      limit: 12,
      sort: "newest",
    });
  });
});

describe("catalogHref", () => {
  const current = parseCatalogParams({ category: "apparel", sort: "price_asc", page: "3" });

  it("keeps filters and resets the page when a filter changes", () => {
    expect(catalogHref(current, { sort: "newest" })).toEqual({
      pathname: "/products",
      query: { category: "apparel" },
    });
  });

  it("sets the page for pagination links", () => {
    expect(catalogHref(current, { page: 4 }).query).toEqual({
      category: "apparel",
      sort: "price_asc",
      page: "4",
    });
  });
});
