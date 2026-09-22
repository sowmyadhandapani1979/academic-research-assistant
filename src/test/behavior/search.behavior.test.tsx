import { fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { searchPapers } from "../../data/fixtures";
import { msw } from "../msw";
import { renderApp } from "../renderApp";

describe("UX: Search screen", () => {
  it("Given the landing page, Then the user sees a simple search field without filter dropdowns", () => {
    const { getByRole, getByPlaceholderText, getAllByRole, getByText, queryByRole } =
      renderApp("/");
    expect(getByRole("heading", { name: /research/i })).toBeInTheDocument();
    expect(
      getByPlaceholderText(/machine learning, CRISPR gene therapy/i),
    ).toBeInTheDocument();
    expect(getByPlaceholderText("Topic or keyword...")).toBeInTheDocument();
    expect(getAllByRole("button", { name: /^search$/i }).length).toBeGreaterThan(0);
    expect(getAllByRole("link", { name: /^search$/i })[0]).toHaveTextContent("Search");
    expect(getAllByRole("link", { name: /my papers/i })[0]).toHaveTextContent("My Papers");
    expect(queryByRole("combobox", { name: /discipline/i })).not.toBeInTheDocument();
    expect(queryByRole("combobox", { name: /publication period/i })).not.toBeInTheDocument();
    expect(getByRole("button", { name: /advanced search/i })).toBeInTheDocument();
    expect(getByRole("button", { name: /^filters$/i })).toBeInTheDocument();
    expect(getByText(/quantum computing/i)).toBeInTheDocument();
    expect(getByText(/climate change/i)).toBeInTheDocument();
  });

  it("Given the landing page, Then action buttons use a pill shape", () => {
    const { getAllByRole, getByRole } = renderApp("/");
    const search = getAllByRole("button", { name: /^search$/i })[0];
    const dark = getByRole("radio", { name: /^dark$/i });
    for (const el of [search, dark]) {
      expect(el.className.split(/\s+/)).toContain("rounded-full");
    }
  });

  it("When the user opens Advanced Search, Then Discipline chips and Year Range appear with nothing selected", async () => {
    const { user, getByRole, queryByRole } = renderApp("/");
    expect(queryByRole("button", { name: /computer science/i })).not.toBeInTheDocument();
    await user.click(getByRole("button", { name: /advanced search/i }));
    expect(getByRole("button", { name: /hide filters/i })).toBeInTheDocument();
    const cs = getByRole("button", { name: /computer science/i });
    expect(cs).toHaveAttribute("aria-pressed", "false");
    expect(cs).toHaveTextContent("Computer Science");
    expect(cs).not.toHaveTextContent("💻");
    expect(getByRole("button", { name: /^management$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(getByRole("button", { name: /^management$/i })).toHaveTextContent("Management");
    expect(getByRole("slider", { name: /^from$/i })).toHaveValue("1990");
    expect(getByRole("slider", { name: /^to$/i })).toHaveValue(String(new Date().getFullYear()));
    expect(getByRole("slider", { name: /^from$/i }).closest("aside")).toHaveTextContent(/any/i);
  });

  it("When the user searches Management papers from 2000 to 2009, Then discipline and year are sent with the query", async () => {
    let requested = "";
    msw.use(
      http.get("/api/papers/search", ({ request }) => {
        requested = request.url;
        return HttpResponse.json({ papers: [], total: 0 });
      }),
    );
    const { user, getByRole, getByPlaceholderText, getAllByRole, findByText } =
      renderApp("/");
    await user.click(getByRole("button", { name: /advanced search/i }));
    await user.click(getByRole("button", { name: /^management$/i }));
    fireEvent.change(getByRole("slider", { name: /^from$/i }), {
      target: { value: "2000" },
    });
    fireEvent.change(getByRole("slider", { name: /^to$/i }), {
      target: { value: "2009" },
    });
    await user.type(
      getByPlaceholderText(/machine learning, CRISPR gene therapy/i),
      "strategy",
    );
    await user.click(getAllByRole("button", { name: /^search$/i })[0]);
    expect(await findByText(/no papers matched/i)).toBeInTheDocument();
    const url = new URL(requested);
    expect(url.searchParams.get("query")).toBe("strategy");
    expect(url.searchParams.get("discipline")).toBe("management");
    expect(url.searchParams.get("from")).toBe("2000");
    expect(url.searchParams.get("to")).toBe("2009");
  });

  it("When the user searches Deep Learning from 2000 to 2009, Then 2010s papers are not listed", async () => {
    const { user, getByRole, getByPlaceholderText, getAllByRole, findByText, queryByRole } =
      renderApp("/");
    await user.click(getByRole("button", { name: /advanced search/i }));
    fireEvent.change(getByRole("slider", { name: /^from$/i }), {
      target: { value: "2000" },
    });
    fireEvent.change(getByRole("slider", { name: /^to$/i }), {
      target: { value: "2009" },
    });
    await user.type(
      getByPlaceholderText(/machine learning, CRISPR gene therapy/i),
      "Deep Learning",
    );
    await user.click(getAllByRole("button", { name: /^search$/i })[0]);
    expect(await findByText(/no papers matched/i)).toBeInTheDocument();
    expect(queryByRole("heading", { name: /attention is all you need/i })).not.toBeInTheDocument();
  });

  it("When the user searches Deep Learning without choosing filters, Then no discipline or year is sent and papers remain", async () => {
    let requested = "";
    msw.use(
      http.get("/api/papers/search", ({ request }) => {
        requested = request.url;
        const url = new URL(request.url);
        const query = url.searchParams.get("query") ?? "";
        const found = searchPapers(query, {
          discipline: url.searchParams.get("discipline") ?? undefined,
          from: url.searchParams.get("from") ?? undefined,
          to: url.searchParams.get("to") ?? undefined,
        });
        return HttpResponse.json({ papers: found, total: found.length });
      }),
    );
    const { user, getByPlaceholderText, getAllByRole, findByRole, getByRole } =
      renderApp("/");
    await user.type(
      getByPlaceholderText(/machine learning, CRISPR gene therapy/i),
      "Deep Learning",
    );
    await user.click(getAllByRole("button", { name: /^search$/i })[0]);
    expect(
      await findByRole("heading", { name: /attention is all you need/i }),
    ).toBeInTheDocument();
    expect(getByRole("heading", { name: /bert/i })).toBeInTheDocument();
    const url = new URL(requested);
    expect(url.searchParams.get("query")).toBe("Deep Learning");
    expect(url.searchParams.get("discipline")).toBeNull();
    expect(url.searchParams.get("from")).toBeNull();
    expect(url.searchParams.get("to")).toBeNull();
  });

  it("Given recent searches, When the user clicks a chip, Then they go to results for that topic", async () => {
    const { user, getAllByRole, findByRole } = renderApp("/");
    await user.click(getAllByRole("button", { name: "Deep Learning" })[0]);
    expect(await findByRole("button", { name: /^search$/i })).toBeInTheDocument();
    expect(
      await findByRole("heading", { name: /attention is all you need/i }),
    ).toBeInTheDocument();
  });

  it("Given an empty query, When the user submits search, Then they stay on search", async () => {
    const { user, getAllByRole, getByPlaceholderText } = renderApp("/");
    await user.click(getAllByRole("button", { name: /^search$/i })[0]);
    expect(
      getByPlaceholderText(/machine learning, CRISPR gene therapy/i),
    ).toBeInTheDocument();
  });
});
