/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from "vitest";
import { findOpenAccessPdf, pdfUrlFromWork } from "./openalex.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("open-access PDF lookup", () => {
  it("picks a repository PDF url and ignores HTML landing pages", () => {
    expect(
      pdfUrlFromWork({
        open_access: { oa_url: "https://doi.org/10.1/abc" },
        best_oa_location: { pdf_url: "https://repo.example.edu/paper.pdf" },
      }),
    ).toBe("https://repo.example.edu/paper.pdf");
  });

  it("looks up a PDF from OpenAlex by DOI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("openalex.org/works/doi:")) {
          return {
            ok: true,
            json: async () => ({
              best_oa_location: { pdf_url: "https://ex.com/a.pdf" },
            }),
          };
        }
        throw new Error(String(url));
      }),
    );
    await expect(
      findOpenAccessPdf({ title: "Queued Transformers", doi: "10.1/abc" }),
    ).resolves.toBe("https://ex.com/a.pdf");
  });
});
