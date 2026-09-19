import { describe, expect, it, vi } from "vitest";
import { renderApp } from "../renderApp";

describe("UX: Notes & Summary", () => {
  it("Given a paper with notes, Then the user sees All Notes, AI summary, and tags", async () => {
    const { findByRole, findByText } = renderApp("/notes/attention");
    expect(
      await findByRole("heading", { name: /notes & summary/i }),
    ).toBeInTheDocument();
    expect(await findByRole("heading", { name: /all notes/i })).toBeInTheDocument();
    expect(
      await findByRole("heading", { name: /ai-generated summary/i }),
    ).toBeInTheDocument();
    expect(await findByText("transformers")).toBeInTheDocument();
    expect(
      await findByText((_, node) => (node?.textContent ?? "") === "Status: In Progress"),
    ).toBeInTheDocument();
  });

  it("When the user copies notes, Then the clipboard receives the note text", async () => {
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const { user, findByRole, getAllByRole } = renderApp("/notes/attention");
    await findByRole("heading", { name: /all notes/i });
    await user.click(getAllByRole("button", { name: /copy all notes/i })[0]);
    expect(write).toHaveBeenCalled();
    const payload = String(write.mock.calls.at(-1)?.[0] ?? "");
    expect(payload.toLowerCase()).toMatch(/self-attention|parallel/);
  });

  it("When the user follows a related paper, Then they open that paper's summary", async () => {
    const { user, findAllByRole, findByRole } = renderApp("/notes/attention");
    await user.click((await findAllByRole("link", { name: /bert/i }))[0]);
    expect(
      await findByRole("heading", {
        name: /bert: pre-training of deep bidirectional transformers/i,
      }),
    ).toBeInTheDocument();
  });

  it("When the user edits a note, Then the updated text is shown", async () => {
    const { user, findByRole, findByText, getAllByRole, getByDisplayValue, getByRole } =
      renderApp("/notes/attention");
    await findByRole("heading", { name: /all notes/i });
    await user.click(getAllByRole("button", { name: /^edit$/i })[0]);
    const box = getByDisplayValue(/multi-head attention/i);
    await user.clear(box);
    await user.type(box, "Edited: heads capture different relations");
    await user.click(getByRole("button", { name: /^save$/i }));
    expect(
      await findByText("Edited: heads capture different relations"),
    ).toBeInTheDocument();
  });

  it("When the user deletes a note, Then it is no longer listed", async () => {
    const { user, findByRole, getAllByRole, queryByText } = renderApp(
      "/notes/attention",
    );
    await findByRole("heading", { name: /all notes/i });
    expect(
      queryByText(/multi-head attention enables model/i),
    ).toBeInTheDocument();
    await user.click(getAllByRole("button", { name: /^delete$/i })[0]);
    expect(
      queryByText(/multi-head attention enables model/i),
    ).not.toBeInTheDocument();
  });
});
