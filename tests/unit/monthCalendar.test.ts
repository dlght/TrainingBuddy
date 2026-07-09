import { buildMonthGrid, formatMonthLabel, shiftMonth } from "@/features/progress/monthCalendar";

describe("buildMonthGrid", () => {
  it("pads the leading cells so the 1st falls on its real weekday (July 2026 starts on Wednesday)", () => {
    const grid = buildMonthGrid(2026, 6);

    expect(grid[0]).toEqual([null, null, null, "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04"]);
  });

  it("pads the trailing cells of the last week", () => {
    const grid = buildMonthGrid(2026, 6);
    const lastWeek = grid[grid.length - 1];

    expect(lastWeek).toEqual(["2026-07-26", "2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31", null]);
  });

  it("every week row has exactly 7 cells", () => {
    const grid = buildMonthGrid(2026, 6);

    expect(grid.every((week) => week.length === 7)).toBe(true);
  });

  it("includes every day exactly once with no padding, for a month starting on Sunday", () => {
    // February 2026 starts on a Sunday.
    const grid = buildMonthGrid(2026, 1);

    expect(grid[0][0]).toBe("2026-02-01");
    expect(grid[0]).not.toContain(null);
  });

  it("handles a leap-year February (29 days)", () => {
    const grid = buildMonthGrid(2024, 1);
    const allDays = grid.flat().filter((cell): cell is string => cell !== null);

    expect(allDays).toHaveLength(29);
    expect(allDays[allDays.length - 1]).toBe("2024-02-29");
  });

  it("handles a non-leap-year February (28 days)", () => {
    const grid = buildMonthGrid(2026, 1);
    const allDays = grid.flat().filter((cell): cell is string => cell !== null);

    expect(allDays).toHaveLength(28);
    expect(allDays[allDays.length - 1]).toBe("2026-02-28");
  });
});

describe("shiftMonth", () => {
  it("moves forward within the same year", () => {
    expect(shiftMonth(2026, 5, 1)).toEqual({ year: 2026, monthIndex: 6 });
  });

  it("moves backward within the same year", () => {
    expect(shiftMonth(2026, 5, -1)).toEqual({ year: 2026, monthIndex: 4 });
  });

  it("rolls over into the next year from December", () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
  });

  it("rolls back into the previous year from January", () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
  });

  it("handles multi-month jumps", () => {
    expect(shiftMonth(2026, 10, 4)).toEqual({ year: 2027, monthIndex: 2 });
  });
});

describe("formatMonthLabel", () => {
  it("formats a month and year label", () => {
    expect(formatMonthLabel(2026, 6)).toBe("July 2026");
    expect(formatMonthLabel(2027, 0)).toBe("January 2027");
  });
});
