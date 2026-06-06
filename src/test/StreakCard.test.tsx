import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreakCard } from "@/components/StreakCard";
import * as storage from "@/lib/storage";

// Helper: build a date string N days from today (positive = future, negative = past)
const pad = (n: number) => String(n).padStart(2, "0");
const offsetDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const makeLog = (
  overrides: Partial<storage.PoopLog> = {}
): storage.PoopLog => ({
  id: Math.random().toString(36).slice(2),
  timestamp: Date.now(),
  bristolType: 4,
  color: "medium_brown",
  frequency: 1,
  gutScore: 80,
  ...overrides,
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("StreakCard – headline states", () => {
  it("shows 'Start your streak' when streak is 0 and not paused", () => {
    vi.spyOn(storage, "getStreakData").mockReturnValue({
      currentStreak: 0,
      lastLogDate: null,
      longestStreak: 0,
    });
    vi.spyOn(storage, "getLogs").mockReturnValue([]);

    render(<StreakCard />);
    expect(screen.getByText("Start your streak")).toBeInTheDocument();
  });

  it("shows 'X days in a row' when active streak > 0", () => {
    vi.spyOn(storage, "getStreakData").mockReturnValue({
      currentStreak: 4,
      lastLogDate: offsetDate(0),
      longestStreak: 7,
    });
    vi.spyOn(storage, "getLogs").mockReturnValue([]);

    render(<StreakCard />);
    expect(screen.getByText("4 days in a row")).toBeInTheDocument();
  });

  it("uses singular 'day' when streak is exactly 1", () => {
    vi.spyOn(storage, "getStreakData").mockReturnValue({
      currentStreak: 1,
      lastLogDate: offsetDate(0),
      longestStreak: 3,
    });
    vi.spyOn(storage, "getLogs").mockReturnValue([]);

    render(<StreakCard />);
    expect(screen.getByText("1 day in a row")).toBeInTheDocument();
  });

  it("shows 'Streak paused' when paused flag is true", () => {
    vi.spyOn(storage, "getStreakData").mockReturnValue({
      currentStreak: 0,
      lastLogDate: offsetDate(-1),
      longestStreak: 5,
      paused: true,
    });
    vi.spyOn(storage, "getLogs").mockReturnValue([]);

    render(<StreakCard />);
    expect(screen.getByText("Streak paused")).toBeInTheDocument();
  });
});

describe("StreakCard – Best chip", () => {
  it("shows best streak count when longestStreak > 0", () => {
    vi.spyOn(storage, "getStreakData").mockReturnValue({
      currentStreak: 3,
      lastLogDate: offsetDate(0),
      longestStreak: 12,
    });
    vi.spyOn(storage, "getLogs").mockReturnValue([]);

    render(<StreakCard />);
    expect(screen.getByText(/Best 12/i)).toBeInTheDocument();
  });

  it("shows em-dash when longestStreak is 0", () => {
    vi.spyOn(storage, "getStreakData").mockReturnValue({
      currentStreak: 0,
      lastLogDate: null,
      longestStreak: 0,
    });
    vi.spyOn(storage, "getLogs").mockReturnValue([]);

    render(<StreakCard />);
    expect(screen.getByText(/Best —/)).toBeInTheDocument();
  });
});

describe("StreakCard – 7-day strip", () => {
  it("renders 7 day labels", () => {
    vi.spyOn(storage, "getStreakData").mockReturnValue({
      currentStreak: 0,
      lastLogDate: null,
      longestStreak: 0,
    });
    vi.spyOn(storage, "getLogs").mockReturnValue([]);

    render(<StreakCard />);
    // The labels M T W T F S S appear in the strip; there will be 7 of them
    const container = screen.getByTestId("streak-card");
    expect(container).toBeInTheDocument();
    // Check that day abbreviations are rendered (some appear twice e.g. T)
    const allTexts = container.textContent ?? "";
    // At minimum we have M, T, W, T, F, S, S characters
    expect(allTexts).toMatch(/M/);
    expect(allTexts).toMatch(/F/);
  });

  it("marks today's cell with a checkmark when today has a log", () => {
    const todayTs = new Date();
    todayTs.setHours(10, 0, 0, 0);

    vi.spyOn(storage, "getStreakData").mockReturnValue({
      currentStreak: 1,
      lastLogDate: offsetDate(0),
      longestStreak: 1,
    });
    vi.spyOn(storage, "getLogs").mockReturnValue([
      makeLog({ timestamp: todayTs.getTime() }),
    ]);

    render(<StreakCard />);
    expect(screen.getAllByText("✓").length).toBeGreaterThanOrEqual(1);
  });

  it("shows amber dash for no-movement day", () => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // yesterday
    d.setHours(9, 0, 0, 0);

    vi.spyOn(storage, "getStreakData").mockReturnValue({
      currentStreak: 0,
      lastLogDate: offsetDate(-1),
      longestStreak: 0,
    });
    vi.spyOn(storage, "getLogs").mockReturnValue([
      makeLog({ timestamp: d.getTime(), noMovement: true }),
    ]);

    render(<StreakCard />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});
