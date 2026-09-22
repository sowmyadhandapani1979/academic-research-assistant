import { describe, expect, it } from "vitest";
import { mockApi } from "../handlers";
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

  it("Given a paper with no open-access PDF, Then Read shows the abstract and that full text is unavailable", async () => {
    mockApi.catalog.push({
      id: "no-oa-pdf",
      title: "Identification and Sense-making in Organizations",
      authorsShort: "Afshari",
      authorsFull: "Afshari, L.",
      year: 2019,
      abstract:
        "The purpose of this paper is to explore the role of sensemaking and identification in the development of employees’ commitment to an organization.",
      sections: [
        {
          heading: "1. Overview",
          paragraphs: [
            "The purpose of this paper is to explore the role of sensemaking and identification in the development of employees’ commitment to an organization.",
          ],
        },
      ],
      related: [],
      summary: "See abstract for key claims.",
      takeaways: "See abstract for key claims.",
      readTime: "5 min",
      url: "https://www.semanticscholar.org/paper/no-oa-pdf",
    });
    const { findByText, queryByRole } = renderApp("/read/no-oa-pdf");
    expect(
      await findByText(/no open-access pdf is available for this paper/i),
    ).toBeInTheDocument();
    expect(
      await findByText(/sensemaking and identification in the development/i),
    ).toBeInTheDocument();
    expect(queryByRole("link", { name: /download pdf/i })).not.toBeInTheDocument();
  });

  it("Given a paper with a PDF, Then Read shows the extracted PDF body", async () => {
    const { findByText, queryByTitle } = renderApp("/read/gpt2");
    expect(
      await findByText(/zero-shot setting, without task-specific training data/i),
    ).toBeInTheDocument();
    expect(
      await findByText(/reading naturally occurring demonstrations in the training set/i),
    ).toBeInTheDocument();
    expect(queryByTitle("Paper PDF")).not.toBeInTheDocument();
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
