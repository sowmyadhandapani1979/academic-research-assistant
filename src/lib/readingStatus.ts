import type { ReadingStatus } from "../types";

export type { ReadingStatus };

export const READING_STATUS_LABEL: Record<ReadingStatus, string> = {
  in_progress: "In Progress",
  yet_to_start: "Yet to Start",
  read: "Read",
};

export function normalizeReadingStatus(input: {
  isRead?: boolean;
  readingStatus?: string | null;
}): ReadingStatus {
  if (input.readingStatus === "read" || input.isRead) return "read";
  if (input.readingStatus === "in_progress") return "in_progress";
  return "yet_to_start";
}

export function readingStatusRank(status: ReadingStatus): number {
  if (status === "in_progress") return 0;
  if (status === "yet_to_start") return 1;
  return 2;
}

export function nextReadingStatus(patch: {
  current?: ReadingStatus;
  readingStatus?: ReadingStatus;
  isRead?: boolean;
  starting?: boolean;
}): ReadingStatus {
  if (patch.readingStatus) return patch.readingStatus;
  if (patch.isRead === true) return "read";
  if (patch.isRead === false) {
    return patch.current === "read" ? "in_progress" : (patch.current ?? "yet_to_start");
  }
  if (patch.starting && patch.current !== "read") return "in_progress";
  return patch.current ?? "yet_to_start";
}
