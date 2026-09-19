import { describe, expect, it } from "vitest";
import { renderApp } from "../renderApp";

describe("UX: Visual reader", () => {
  it("Given a paper, Then the user sees the article and a notes sidebar", async () => {
    const { findAllByRole, findByRole, findByPlaceholderText } = renderApp(
      "/read/attention",
    );
    expect(
      (await findAllByRole("heading", { name: /attention is all you need/i }))
        .length,
    ).toBeGreaterThan(0);
    expect(await findByRole("heading", { name: /^notes$/i })).toBeInTheDocument();
    expect(await findByPlaceholderText(/add a note/i)).toBeInTheDocument();
    expect(await findByRole("button", { name: /add note/i })).toBeInTheDocument();
    expect((await findAllByRole("link", { name: /^summary$/i })).length).toBeGreaterThan(0);
    expect((await findAllByRole("button", { name: /^listen$/i })).length).toBeGreaterThan(0);
    expect((await findAllByRole("button", { name: /^mark as read$/i })).length).toBeGreaterThan(0);
    expect(await findByRole("link", { name: /attention is all you need/i })).toHaveAttribute(
      "href",
      "https://arxiv.org/abs/1706.03762",
    );
  });

  it("When the user saves a typed note, Then it appears in the sidebar", async () => {
    const { user, findByPlaceholderText, findByText, getByRole } = renderApp(
      "/read/attention",
    );
    const box = await findByPlaceholderText(/add a note/i);
    await user.type(box, "Parallelism is the main claim");
    await user.click(getByRole("button", { name: /add note/i }));
    expect(
      await findByText("Parallelism is the main claim"),
    ).toBeInTheDocument();
  });

  it("When the user deletes a sidebar note, Then it disappears", async () => {
    const { user, findByText, getAllByRole, queryByText } = renderApp(
      "/read/attention",
    );
    expect(
      await findByText(/key advantage: parallel processing/i),
    ).toBeInTheDocument();
    await user.click(getAllByRole("button", { name: /^delete$/i })[1]);
    expect(
      queryByText(/key advantage: parallel processing/i),
    ).not.toBeInTheDocument();
  });

  it("When the user opens Summary, Then they leave the reader for notes & summary", async () => {
    const { user, findAllByRole, findByRole } = renderApp("/read/attention");
    await user.click((await findAllByRole("link", { name: /summary/i }))[0]);
    expect(
      await findByRole("heading", { name: /notes & summary/i }),
    ).toBeInTheDocument();
  });
});
