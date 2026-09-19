import { describe, expect, it } from "vitest";
import { parseIntent } from "../../voice/intents";

describe("UX: Listen spoken intents (PRD 5a)", () => {
  it("maps playback instructions", () => {
    expect(parseIntent("pause").type).toBe("pause");
    expect(parseIntent("hold").type).toBe("pause");
    expect(parseIntent("hold on").type).toBe("pause");
    expect(parseIntent("resume").type).toBe("resume");
    expect(parseIntent("skip").type).toBe("skip");
    expect(parseIntent("next section").type).toBe("skip");
    expect(parseIntent("repeat").type).toBe("repeat");
    expect(parseIntent("slower").type).toBe("rate");
  });

  it("maps place, notes, status, and mode", () => {
    expect(parseIntent("jump to abstract")).toEqual({
      type: "jump",
      target: "abstract",
    });
    expect(parseIntent("take a note: transformers drop recurrence")).toEqual({
      type: "note",
      content: "transformers drop recurrence",
    });
    expect(parseIntent("mark as read")).toEqual({
      type: "markRead",
      isRead: true,
    });
    expect(parseIntent("switch to visual").type).toBe("visual");
  });

  it("asks for clarification on short unknown phrases and saves longer speech as a note", () => {
    expect(parseIntent("hmm").type).toBe("clarify");
    expect(parseIntent("this architecture reminds me of lstm gates")).toEqual({
      type: "fallbackNote",
      content: "this architecture reminds me of lstm gates",
    });
  });
});
