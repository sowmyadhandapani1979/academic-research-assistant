import { describe, expect, it } from "vitest";
import { renderApp } from "../renderApp";

describe("UX: My Papers library", () => {
  it("Given marked papers, Then each row offers Open, Listen, and Summary", async () => {
    const { findByRole, getAllByRole, getByPlaceholderText } = renderApp("/library");
    expect(
      await findByRole("heading", { name: /my marked papers/i }),
    ).toBeInTheDocument();
    expect(getByPlaceholderText("Search by title, author...")).toBeInTheDocument();
    expect(getByPlaceholderText("Search...")).toBeInTheDocument();
    const open = getAllByRole("link", { name: /^open$/i })[0];
    expect(open).toHaveTextContent("📖");
    expect(getAllByRole("link", { name: /^listen$/i })[0]).toHaveTextContent("🎧");
    expect(getAllByRole("link", { name: /^summary$/i })[0]).toHaveTextContent("📋");
    expect(getAllByRole("button", { name: /remove /i })[0]).toHaveTextContent("🗑");
  });

  it("Given mixed reading statuses, Then rows show In Progress, Yet to Start, or Read instead of a flag", async () => {
    const { findByRole, getAllByText, queryByText } = renderApp("/library");
    await findByRole("heading", { name: /my marked papers/i });
    expect(getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(getAllByText("Yet to Start").length).toBeGreaterThan(0);
    expect(getAllByText("Read").length).toBeGreaterThan(0);
    expect(queryByText("🚩")).not.toBeInTheDocument();
    expect(queryByText("Unread")).not.toBeInTheDocument();
  });

  it("Given unread and read papers, When the user filters Yet to Start, Then only unstarted titles remain", async () => {
    const { user, findByRole, getByRole, queryByRole } = renderApp("/library");
    await findByRole("heading", { name: /attention is all you need/i });
    await user.selectOptions(
      getByRole("combobox", { name: /filter by read status/i }),
      "yet_to_start",
    );
    expect(getByRole("heading", { name: /gpt-2/i })).toBeInTheDocument();
    expect(
      queryByRole("heading", { name: /attention is all you need/i }),
    ).not.toBeInTheDocument();
    expect(queryByRole("heading", { name: /bert:/i })).not.toBeInTheDocument();
  });

  it("Given a tag filter, When nlp is selected, Then matching papers stay visible", async () => {
    const { user, findByRole, getByRole } = renderApp("/library");
    await findByRole("heading", { name: /attention is all you need/i });
    await user.selectOptions(
      getByRole("combobox", { name: /filter by tag/i }),
      "nlp",
    );
    expect(
      getByRole("heading", { name: /attention is all you need/i }),
    ).toBeInTheDocument();
    expect(getByRole("heading", { name: /bert/i })).toBeInTheDocument();
  });

  it("When the user chooses Listen, Then they open the reader in Listen mode", async () => {
    const { user, findByRole, getAllByRole, findByPlaceholderText } =
      renderApp("/library");
    await findByRole("heading", { name: /my marked papers/i });
    await user.click(getAllByRole("link", { name: /listen/i })[0]);
    expect(
      await findByPlaceholderText(/type a command or note/i),
    ).toBeInTheDocument();
    expect(
      await findByRole("button", { name: /allow microphone|mic on/i }),
    ).toBeInTheDocument();
  });

  it("Given My Papers, Then papers are ordered In Progress, Yet to Start, then Read", async () => {
    const { findByRole, getAllByRole } = renderApp("/library");
    await findByRole("heading", { name: /my marked papers/i });
    const titles = getAllByRole("heading", { level: 3 }).map((el) => el.textContent ?? "");
    expect(titles[0]).toMatch(/attention/i);
    expect(titles[1]).toMatch(/gpt-2/i);
    expect(titles[2]).toMatch(/bert/i);
  });

  it("When the user sorts by tag, Then papers are ordered by tag", async () => {
    const { user, findByRole, getByRole, getAllByRole } = renderApp("/library");
    await findByRole("heading", { name: /my marked papers/i });
    await user.selectOptions(getByRole("combobox", { name: /sort papers/i }), "tag");
    const titles = getAllByRole("heading", { level: 3 }).map((el) => el.textContent ?? "");
    expect(titles[0]).toMatch(/attention/i);
    expect(titles[1]).toMatch(/gpt-2/i);
    expect(titles[2]).toMatch(/bert/i);
  });

  it("When the user removes a paper, Then it leaves My Papers", async () => {
    const { user, findByRole, getByRole, queryByRole } = renderApp("/library");
    await findByRole("heading", { name: /attention is all you need/i });
    await user.click(
      getByRole("button", { name: /remove attention is all you need/i }),
    );
    expect(
      queryByRole("heading", { name: /attention is all you need/i }),
    ).not.toBeInTheDocument();
    expect(getByRole("heading", { name: /bert/i })).toBeInTheDocument();
  });
});
