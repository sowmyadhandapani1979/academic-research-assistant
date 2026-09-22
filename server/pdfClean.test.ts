/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { cleanPdfDump, markdownToSections } from "./pdfClean.js";

describe("local PDF cleanup", () => {
  it("turns markdown into readable paper sections", () => {
    const sections = markdownToSections(`## Introduction
Self-attention lets every position attend to every other position.

Broken line
wraps are merged.

## Method
Multi-head attention uses several learned projections.`);
    expect(sections.map((s) => s.heading)).toEqual(["Introduction", "Method"]);
    expect(sections[0].paragraphs[0]).toMatch(/self-attention/i);
    expect(sections[1].paragraphs[0]).toMatch(/multi-head/i);
  });

  it("uses a local model to rewrite a PDF dump instead of keeping the raw extract", async () => {
    const generate = vi.fn(async () => `## Introduction

The Transformer relies solely on attention, without recurrence or convolution.`);
    const cleaned = await cleanPdfDump(
      "1 Introduc-\ntion\nThe Trans-\nformer relies solely on attention  12\nHEADER",
      generate,
      async () => "phi3:mini",
    );
    expect(generate).toHaveBeenCalled();
    expect(cleaned).toContain("## Introduction");
    expect(cleaned).not.toContain("HEADER");
    const sections = markdownToSections(cleaned ?? "");
    expect(sections[0].heading).toBe("Introduction");
    expect(sections[0].paragraphs.join(" ")).toMatch(/transformer relies solely on attention/i);
  });

  it("returns null when no local model is available so the dump can be used", async () => {
    const generate = vi.fn(async () => "should not run");
    const cleaned = await cleanPdfDump("noisy dump", generate, async () => null);
    expect(cleaned).toBeNull();
    expect(generate).not.toHaveBeenCalled();
  });

  it("returns null when the local model fails so the dump can be used", async () => {
    const generate = vi.fn(async () => {
      throw new Error("ollama down");
    });
    const cleaned = await cleanPdfDump("noisy dump of an academic paper", generate, async () => "phi3:mini");
    expect(cleaned).toBeNull();
  });
});
