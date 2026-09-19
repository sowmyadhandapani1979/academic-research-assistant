import { describe, expect, it } from "vitest";
import { recognitionInstances, speechSynth, ttsUtterances } from "../setup";
import { renderApp } from "../renderApp";

describe("UX: Listen voice partner", () => {
  it("Given Listen mode, Then the user sees play, mic permission, and a command box", async () => {
    const { findAllByRole, findByRole, findByPlaceholderText } = renderApp(
      "/read/attention?listen=1",
    );
    expect(
      (await findAllByRole("button", { name: /pause|play/i })).length,
    ).toBeGreaterThan(0);
    expect(
      await findByRole("button", { name: /allow microphone|mic on|mic off/i }),
    ).toBeInTheDocument();
    expect(
      await findByPlaceholderText(/type a command or note/i),
    ).toBeInTheDocument();
  });

  it("When the user types take a note, Then the note is saved as a voice note", async () => {
    const { user, findByPlaceholderText, findByText, getByRole } = renderApp(
      "/read/attention?listen=1",
    );
    const cmd = await findByPlaceholderText(/type a command or note/i);
    await user.type(cmd, "take a note: barge-in should pause reading");
    await user.click(getByRole("button", { name: /^go$/i }));
    expect(
      await findByText("barge-in should pause reading"),
    ).toBeInTheDocument();
    expect(await findByText(/· voice/i)).toBeInTheDocument();
  });

  it("When the user types hold, Then reading pauses the same way as pause", async () => {
    const { user, findByPlaceholderText, findAllByText, getByRole } = renderApp(
      "/read/attention?listen=1",
    );
    const cmd = await findByPlaceholderText(/type a command or note/i);
    await user.type(cmd, "hold");
    await user.click(getByRole("button", { name: /^go$/i }));
    const paused = await findAllByText(/paused/i);
    expect(paused.length).toBeGreaterThan(0);
    expect(speechSynth.pause).toHaveBeenCalled();
  });

  it("When the user pauses then resumes, Then reading continues from the same place", async () => {
    const { user, findByPlaceholderText, findAllByRole, getByRole } = renderApp(
      "/read/attention?listen=1",
    );
    const cmd = await findByPlaceholderText(/type a command or note/i);
    await user.type(cmd, "pause");
    await user.click(getByRole("button", { name: /^go$/i }));
    await findAllByRole("button", { name: /^play$/i });
    const spokenBefore = ttsUtterances.map((u) => u.text);
    await user.type(cmd, "resume");
    await user.click(getByRole("button", { name: /^go$/i }));
    expect(speechSynth.resume).toHaveBeenCalled();
    expect(ttsUtterances.map((u) => u.text)).toEqual(spokenBefore);
    expect(
      (await findAllByRole("button", { name: /^pause$/i })).length,
    ).toBeGreaterThan(0);
  });

  it("When the user types pause, Then the UI shows the pause action", async () => {
    const { user, findByPlaceholderText, findAllByText, getByRole } = renderApp(
      "/read/attention?listen=1",
    );
    const cmd = await findByPlaceholderText(/type a command or note/i);
    await user.type(cmd, "pause");
    await user.click(getByRole("button", { name: /^go$/i }));
    const paused = await findAllByText(/paused/i);
    expect(paused.length).toBeGreaterThan(0);
  });

  it("Given the paper is being read, When the mic hears the reading itself, Then playback keeps going", async () => {
    const { findAllByRole } = renderApp("/read/attention?listen=1");
    await findAllByRole("button", { name: /^pause$/i });
    const rec = recognitionInstances.at(-1);
    rec?.emit("Attention Is All You Need, by Vaswani et al., 2017.", true);
    expect(
      (await findAllByRole("button", { name: /^pause$/i })).length,
    ).toBeGreaterThan(0);
  });

  it("Given the paper is being read, When the user speaks a command, Then reading stops and the command runs without using Pause", async () => {
    const { findAllByRole, findByText } = renderApp("/read/attention?listen=1");
    await findAllByRole("button", { name: /pause/i });
    const rec = recognitionInstances.at(-1);
    expect(rec).toBeTruthy();
    rec?.emit("pause", true);
    expect(await findByText(/^paused\.?$/i)).toBeInTheDocument();
    expect(
      (await findAllByRole("button", { name: /^play$/i })).length,
    ).toBeGreaterThan(0);
  });
});
