import { beforeEach, describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { renderApp } from "../renderApp";

function mockPrefersColorScheme(dark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) =>
      ({
        matches: query.includes("dark") ? dark : false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}

describe("UX: Theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
    mockPrefersColorScheme(false);
  });

  it("Given a screen, Then Light, Dark, and System are icons on the right of the header, not text beside the tabs", () => {
    const { getByRole, queryByText } = renderApp("/");
    const nav = getByRole("navigation", { name: /^main$/i });
    expect(within(nav).getByRole("radiogroup", { name: /^theme$/i })).toBe(
      nav.lastElementChild,
    );
    expect(within(nav).getByRole("radio", { name: /^light$/i })).toBeInTheDocument();
    expect(within(nav).getByRole("radio", { name: /^dark$/i })).toBeInTheDocument();
    expect(within(nav).getByRole("radio", { name: /^system$/i })).toBeInTheDocument();
    expect(queryByText(/^Light$/)).not.toBeInTheDocument();
    expect(queryByText(/^Dark$/)).not.toBeInTheDocument();
    expect(queryByText(/^System$/)).not.toBeInTheDocument();
  });

  it("When the user chooses Dark, Then the interface uses the dark theme", async () => {
    const { user, getByRole } = renderApp("/");
    await user.click(getByRole("radio", { name: /^dark$/i }));
    expect(getByRole("radio", { name: /^dark$/i })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("When the user chooses Light, Then the interface uses the light theme", async () => {
    const { user, getByRole } = renderApp("/");
    await user.click(getByRole("radio", { name: /^dark$/i }));
    await user.click(getByRole("radio", { name: /^light$/i }));
    expect(getByRole("radio", { name: /^light$/i })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("When the user chooses System and the OS prefers dark, Then the interface follows the OS with dark theme", async () => {
    mockPrefersColorScheme(true);
    const { user, getByRole } = renderApp("/");
    await user.click(getByRole("radio", { name: /^system$/i }));
    expect(getByRole("radio", { name: /^system$/i })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("Given System and a light OS, Then the interface uses the light theme", () => {
    mockPrefersColorScheme(false);
    localStorage.setItem("ara-theme", "system");
    renderApp("/");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("Given a saved Dark choice, When the app loads, Then dark theme is applied", () => {
    localStorage.setItem("ara-theme", "dark");
    renderApp("/library");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.querySelector('[role="radiogroup"][aria-label="Theme"]')).toBeTruthy();
  });
});
