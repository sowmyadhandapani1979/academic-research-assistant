import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { renderApp } from "../renderApp";
import { msw } from "../msw";
import { papers } from "../../data/fixtures";

describe("UX: Results screen", () => {
  it("Given a result card, Then the paper title is a link to the original source", async () => {
    const { findByRole, findAllByRole } = renderApp("/results?q=Deep%20Learning");
    await findByRole("heading", { name: /attention is all you need/i });
    const source = (
      await findAllByRole("link", { name: /attention is all you need/i })
    )[0];
    expect(source).toHaveAttribute("href", "https://arxiv.org/abs/1706.03762");
    expect(source).toHaveAttribute("target", "_blank");
  });

  it("Given a topic search, Then paper cards show title, authors, pin, Open, and tags without abstracts", async () => {
    const { findByRole, findAllByPlaceholderText, getAllByRole, getByRole, getByPlaceholderText, queryByText, queryByRole } =
      renderApp("/results?q=Deep%20Learning");
    expect(
      await findByRole("heading", { name: /attention is all you need/i }),
    ).toBeInTheDocument();
    expect((await findAllByPlaceholderText("+ Add tag")).length).toBeGreaterThan(0);
    expect(getAllByRole("button", { name: /pin for reading/i }).length).toBeGreaterThan(0);
    expect(getAllByRole("button", { name: /pin for reading/i })[0]).toBeEnabled();
    expect(getAllByRole("link", { name: /^open$/i }).length).toBeGreaterThan(0);
    expect(getByPlaceholderText("Search...")).toBeInTheDocument();
    expect(getByRole("button", { name: /^filters$/i })).toBeInTheDocument();
    expect(getByRole("button", { name: /^search$/i })).toBeInTheDocument();
    expect(queryByRole("combobox", { name: /discipline/i })).not.toBeInTheDocument();
    expect(queryByRole("combobox", { name: /publication period/i })).not.toBeInTheDocument();
    expect(queryByText(/dispensing with recurrence/i)).not.toBeInTheDocument();
    expect(queryByText(/jointly conditioning on both left and right/i)).not.toBeInTheDocument();
  });

  it("Given collapsed results, When the user expands a paper, Then only that abstract is shown", async () => {
    const { user, findByRole, getAllByRole, queryByText } = renderApp(
      "/results?q=Deep%20Learning",
    );
    await findByRole("heading", { name: /attention is all you need/i });
    const expanders = getAllByRole("button", { name: /show abstract/i });
    expect(expanders[0]).toHaveTextContent("+");
    expect(expanders[0]).not.toHaveTextContent("▸");
    await user.click(expanders[0]);
    const hide = await findByRole("button", { name: /hide abstract/i });
    expect(hide).toHaveTextContent("-");
    expect(hide).not.toHaveTextContent("▾");
    expect(queryByText(/dispensing with recurrence/i)).toBeInTheDocument();
    expect(queryByText(/jointly conditioning on both left and right/i)).not.toBeInTheDocument();
    await user.click(getAllByRole("button", { name: /show abstract/i })[0]);
    expect(queryByText(/dispensing with recurrence/i)).not.toBeInTheDocument();
    expect(queryByText(/jointly conditioning on both left and right/i)).toBeInTheDocument();
  });

  it("Given a pinned paper, When the user toggles the pin, Then the paper is unpinned", async () => {
    const { user, findByRole, getAllByRole } = renderApp(
      "/results?q=transformers",
    );
    await findByRole("heading", { name: /attention is all you need/i });
    const pin = getAllByRole("button", { name: /unpin for reading/i })[0];
    expect(pin).toHaveAttribute("aria-pressed", "true");
    await user.click(pin);
    expect(pin).toHaveAccessibleName(/pin for reading/i);
    expect(pin).toHaveAttribute("aria-pressed", "false");
    expect(pin).not.toHaveTextContent("☐");
  });

  it("Given a result card, When the user types a tag and submits, Then the tag chip appears", async () => {
    const { user, findByRole, getAllByPlaceholderText, findByText } = renderApp(
      "/results?q=BERT",
    );
    await findByRole("heading", { name: /bert/i });
    const tagInput = getAllByPlaceholderText("+ Add tag")[0];
    await user.type(tagInput, "survey{enter}");
    expect(await findByText("survey")).toBeInTheDocument();
  });

  it("Given a nonsense query, Then the empty results message is shown", async () => {
    const { findByText } = renderApp("/results?q=zzzz-no-such-topic");
    expect(
      await findByText(/no papers matched/i),
    ).toBeInTheDocument();
  });

  it("Given a paper title with MathML, Then the card heading is readable formula text", async () => {
    msw.use(
      http.get("/api/papers/search", () =>
        HttpResponse.json({
          papers: [
            {
              ...papers[0],
              id: "mathml-paper",
              title:
                'Anisotropic magnetic behavior of <mml:math xmlns:mml="http://www.w3.org/1998/Math/MathML"><mml:mrow><mml:msub><mml:mi>Nd</mml:mi><mml:mn>3</mml:mn></mml:msub><mml:msub><mml:mi>ScBi</mml:mi><mml:mn>5</mml:mn></mml:msub></mml:mrow></mml:math>',
            },
          ],
          total: 1,
        }),
      ),
    );
    const { findByRole, queryByText } = renderApp("/results?q=anisotropic");
    expect(
      await findByRole("heading", {
        name: /anisotropic magnetic behavior of nd3scbi5/i,
      }),
    ).toBeInTheDocument();
    expect(queryByText(/mml:math|xmlns:mml/i)).not.toBeInTheDocument();
  });

  it("Given a truncated MathML title, Then the card does not show the markup stump", async () => {
    msw.use(
      http.get("/api/papers/search", () =>
        HttpResponse.json({
          papers: [
            {
              ...papers[0],
              id: "mott-paper",
              title:
                'Probing the Mott insulating behavior of Ba2MgReO6 with <mml:math xmlns:mml="http://www.w3.org/1998',
            },
          ],
          total: 1,
        }),
      ),
    );
    const { findByRole, queryByText } = renderApp("/results?q=mott");
    expect(
      await findByRole("heading", {
        name: /probing the mott insulating behavior of ba2mgreo6 with/i,
      }),
    ).toBeInTheDocument();
    expect(queryByText(/mml:math|xmlns:mml/i)).not.toBeInTheDocument();
  });
});
