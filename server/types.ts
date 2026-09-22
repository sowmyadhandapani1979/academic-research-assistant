import type { LibraryEntry, Note, Paper } from "../src/types.js";

export type ApiErrorBody = { error: string; code: string };

export type MarkedPaperDto = LibraryEntry & {
  paper: Paper;
  notes: Note[];
};

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
