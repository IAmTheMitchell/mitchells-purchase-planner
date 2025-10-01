import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { LS_KEY } from "./persistence";

interface MockStorageResult {
  storage: Storage;
  store: Record<string, string>;
}

function createMockStorage(
  initial: Record<string, string> = {},
): MockStorageResult {
  const store: Record<string, string> = { ...initial };
  const storage = {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    get length() {
      return Object.keys(store).length;
    },
  } as Storage;

  return { storage, store };
}

const LEGACY_KEY = "future-purchase-planner.scenarios.v1";

describe("App", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    const mock = createMockStorage();
    store = mock.store;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: mock.storage,
    });
  });

  it("renders the default scenario when storage is empty", async () => {
    render(<App />);

    const heading = await screen.findByRole("heading", {
      name: "Mitchell's Purchase Planner",
    });
    expect(heading).toBeInTheDocument();

    const scenarios = await screen.findAllByDisplayValue("My Scenario");
    expect(scenarios.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(store[LS_KEY]).toBeDefined();
    });

    const saved = JSON.parse(store[LS_KEY]);
    expect(Array.isArray(saved)).toBe(true);
    expect(saved).toHaveLength(1);
  });

  it("persists newly created scenarios", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findAllByDisplayValue("My Scenario");

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /new scenario/i }));
    });

    await waitFor(() => {
      const saved = JSON.parse(store[LS_KEY]);
      expect(saved).toHaveLength(2);
    });
  });

  it("migrates scenarios saved under the legacy storage key", async () => {
    const preloaded = JSON.stringify([
      { id: "legacy", name: "Legacy Scenario", analysisYears: 10, items: [] },
    ]);

    const mock = createMockStorage({ [LEGACY_KEY]: preloaded });
    store = mock.store;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: mock.storage,
    });

    render(<App />);
    const options = await screen.findAllByDisplayValue("Legacy Scenario");
    expect(options.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(store[LS_KEY]).toBeDefined();
    });

    expect(JSON.parse(store[LS_KEY])).toEqual(JSON.parse(preloaded));
  });
});
