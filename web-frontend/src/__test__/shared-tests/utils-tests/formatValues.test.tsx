import {
  formatValue,
  formatCurrency,
  formatDecimals,
} from "../../../shared/utils";

describe("tests for helper: formatCurrency", () => {
  it("formatCurrency should return a formatted number", () => {
    const formattedCurrency = formatCurrency(1000);
    expect(formattedCurrency).toBe("$1,000.00");
  });

  it("correctly formats small decimals", () => {
    const smallDecimal = formatCurrency(0.00000000000012);
    expect(smallDecimal).toBe("$0.0₁₁ 1");
    const singleDigitDecimal = formatCurrency(0.0000003);
    expect(singleDigitDecimal).toBe("$0.0₅ 3");
    const oneZeroDecimal = formatCurrency(0.03);
    expect(oneZeroDecimal).toBe("$0.03");
  });

  it("formatCurrency handles decimal numbers correctly", () => {
    const formattedCurrency: string = formatCurrency(1000.1);
    expect(formattedCurrency).toBe("$1,000.10");
  });

  it("returns '--' for null input", () => {
    expect(formatCurrency(null)).toBe("--");
  });

  it("returns '--' for NaN input", () => {
    expect(formatCurrency(NaN)).toBe("--");
  });

  it("handles zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("handles negative numbers correctly", () => {
    expect(formatCurrency(-1000)).toBe("-$1,000.00");
    expect(formatCurrency(-0.0005)).toBe("$-0.0₂ 5");
  });

  it("handles very large numbers", () => {
    expect(formatCurrency(999999999)).toBe("$999,999,999.00");
  });
});

describe("tests for helper: formatValue", () => {
  it("formatValue should return max 2 decimals", () => {
    const formattedValue = formatValue(1.2314);
    expect(formattedValue).toBe("1.23");
  });

  it("limits decimals to 2 places for numbers under 1M", () => {
    expect(formatValue(123.456789)).toBe("123.46");
    expect(formatValue(999.999)).toBe("1000.00");
  });

  it("rounds correctly", () => {
    const round = formatValue(999999.999);
    expect(round).toBe("1.00 M");
  });

  it("correctly formats higher numbers", () => {
    const underMillion = formatValue(999999.1235);
    expect(underMillion).toBe("999999.12");
    const million = formatValue(8569959.989);
    expect(million).toBe("8.57 M");
    const billion = formatValue(8569999959.989);
    expect(billion).toBe("8.57 B");
    const trillion = formatValue(8569999959900.989);
    expect(trillion).toBe("8.57 T");
    const overTrillion = formatValue(8569999959900000000.989);
    expect(overTrillion).toBe("8569999.96 T");
  });

  it("correctly formats small decimals", () => {
    const smallDecimal = formatValue(0.00000000000012);
    expect(smallDecimal).toBe("0.0₁₁ 1");
    const singleDigitDecimal = formatValue(0.0000003);
    expect(singleDigitDecimal).toBe("0.0₅ 3");
    const oneZeroDecimal = formatValue(0.03);
    expect(oneZeroDecimal).toBe("0.03");
  });

  it("returns '--' for NaN input", () => {
    expect(formatValue(NaN)).toBe("--");
  });

  it("handles zero correctly", () => {
    expect(formatValue(0)).toBe("0.00");
  });

  it("handles negative numbers correctly", () => {
    expect(formatValue(-1000)).toBe("-1000.00");
    expect(formatValue(-5000000)).toBe("-5.00 M");
    expect(formatValue(-0.0005)).toBe("-0.0₂ 5");
  });

  it("uses millions notation at exactly 1M", () => {
    expect(formatValue(1000000)).toBe("1.00 M");
  });

  it("uses billions notation at exactly 1B", () => {
    expect(formatValue(1000000000)).toBe("1.00 B");
  });

  it("uses trillions notation at exactly 1T", () => {
    expect(formatValue(1000000000000)).toBe("1.00 T");
  });

  it("handles boundary just below 1M", () => {
    expect(formatValue(999999)).toBe("999999.00");
  });

  it("handles boundary just below 1B", () => {
    expect(formatValue(999999999)).toBe("1000.00 M");
  });

  it("handles boundary just below 1T", () => {
    expect(formatValue(999999999999)).toBe("1000.00 B");
  });
});

describe("test for helper: formatDecimals", () => {
  it("returns formatted string with subscript when number is in exponential notation (e.g. 1.23e-5)", () => {
    const num = 1.23e-5;
    const roundedNumber = 0.00001;
    expect(formatDecimals(num, roundedNumber)).toBe("0.0₃ 12");
  });

  it("returns roundedNumber string when there are fewer than 3 leading zeros after decimal", () => {
    const num = 0.00123;
    const roundedNumber = 0.001;
    expect(formatDecimals(num, roundedNumber)).toBe("0.001");
  });

  it("handles case with exactly 2 leading zeros - should NOT use subscript", () => {
    const num = 0.001234;
    const roundedNumber = 0.001;
    expect(formatDecimals(num, roundedNumber)).toBe("0.001");
  });

  it("handles number with no leading zeros in decimal part", () => {
    const num = 0.12;
    const roundedNumber = 0.12;
    expect(formatDecimals(num, roundedNumber)).toBe("0.12");
  });

  it("handles number that becomes exponential like 1e-8 and uses correct formatting", () => {
    const num = 1e-8;
    const roundedNumber = 0;
    expect(formatDecimals(num, roundedNumber)).toBe("0.0₆ 1");
  });

  it("handles trailing zeros after leading zeros (e.g. 0.0000100)", () => {
    const num = 0.00001;
    const roundedNumber = 0.00001;
    expect(formatDecimals(num, roundedNumber)).toBe("0.0₃ 1");
  });

  it("handles number with long chain of zeros before and after digits (e.g. 0.0000045000)", () => {
    const num = 0.0000045;
    const roundedNumber = 0.0000045;
    expect(formatDecimals(num, roundedNumber)).toBe("0.0₄ 45");
  });

  it("handles case where decimal part is empty (e.g. integer)", () => {
    const num = 1;
    const roundedNumber = 1;
    expect(formatDecimals(num, roundedNumber)).toBe("1");
  });

  it("uses all subscript digits correctly (0-9)", () => {
    // Test all subscript digits by creating numbers with different amounts of leading zeros
    expect(formatDecimals(0.000000001, 0)).toBe("0.0₇ 1"); // 7 zeros → subscript ₇
    expect(formatDecimals(0.00000001, 0)).toBe("0.0₆ 1"); // 6 zeros → subscript ₆
    expect(formatDecimals(0.0000001, 0)).toBe("0.0₅ 1"); // 5 zeros → subscript ₅
    expect(formatDecimals(0.000001, 0)).toBe("0.0₄ 1"); // 4 zeros → subscript ₄
    expect(formatDecimals(0.00001, 0)).toBe("0.0₃ 1"); // 3 zeros → subscript ₃
    expect(formatDecimals(0.0000000001, 0)).toBe("0.0₈ 1"); // 8 zeros → subscript ₈
    expect(formatDecimals(0.00000000001, 0)).toBe("0.0₉ 1"); // 9 zeros → subscript ₉
  });

  it("handles multi-digit subscripts (e.g. 10, 11, 12 leading zeros)", () => {
    expect(formatDecimals(0.00000000001, 0)).toBe("0.0₁₀ 1"); // 10 zeros → subscript ₁₀
    expect(formatDecimals(0.000000000001, 0)).toBe("0.0₁₁ 1"); // 11 zeros → subscript ₁₁
    expect(formatDecimals(0.0000000000001, 0)).toBe("0.0₁₂ 1"); // 12 zeros → subscript ₁₂
  });

  it("handles edge case where number is exactly 0", () => {
    const num = 0;
    const roundedNumber = 0;
    expect(formatDecimals(num, roundedNumber)).toBe("0");
  });

  it("handles number between 0 and 1 with no leading zeros after decimal", () => {
    const num = 0.5;
    const roundedNumber = 0.5;
    expect(formatDecimals(num, roundedNumber)).toBe("0.5");
  });
});
