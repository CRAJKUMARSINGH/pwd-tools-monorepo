import { describe, expect, it } from "vitest";
import { convertAtCaret } from "./transliterate";

describe("letter field transliteration", () => {
  it("converts at the caret while preserving text to its right", () => {
    const value = "naam आगे";
    const edit = convertAtCaret(value, 4, 5, " ");
    expect(edit).toEqual({ value: "नाम आगे", caret: 4 });
  });

  it.each(["\n", "।"])("keeps the requested word separator %j", (separator) => {
    expect(convertAtCaret("naam", 4, 4, separator)).toEqual({ value: "नाम" + separator, caret: 4 });
  });

  it("leaves Hindi and numbers to normal browser editing", () => {
    expect(convertAtCaret("123", 3, 3, " ")).toBeNull();
    expect(convertAtCaret("नाम", 3, 3, " ")).toBeNull();
  });
});
