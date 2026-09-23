import { describe, expect, it } from "vitest";
import { formatPaise } from "./format";

describe("formatPaise", () => {
  it("formats whole rupees with Indian grouping", () => {
    expect(formatPaise(123_456_700)).toBe("₹12,34,567.00");
  });

  it("formats paise as decimals", () => {
    expect(formatPaise(99_950)).toBe("₹999.50");
  });

  it("formats zero", () => {
    expect(formatPaise(0)).toBe("₹0.00");
  });
});
