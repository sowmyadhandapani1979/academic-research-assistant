import { cx, ui } from "../theme/classes";
import { IconAction } from "./controls";
import {
  READING_STATUS_LABEL,
  type ReadingStatus,
} from "../lib/readingStatus";

export type ChipTone = "blue" | "purple" | "orange";

export function TagChip({ label, tone = "blue" }: { label: string; tone?: ChipTone }) {
  const toneClass =
    tone === "purple" ? ui.chipPurple : tone === "orange" ? ui.chipOrange : ui.chipBlue;
  return <span className={cx(ui.chip, toneClass)}>{label}</span>;
}

export function StatusBadge({ status }: { status: ReadingStatus }) {
  const tone =
    status === "read"
      ? ui.badgeRead
      : status === "in_progress"
        ? ui.badgeProgress
        : ui.badgeUnread;
  return <span className={cx(ui.badge, tone)}>{READING_STATUS_LABEL[status]}</span>;
}

export function ContentBadge({ hasFullText }: { hasFullText: boolean }) {
  return (
    <span className={cx(ui.badge, hasFullText ? ui.badgeFullText : ui.badgeAbstract)}>
      {hasFullText ? "Full text" : "Abstract only"}
    </span>
  );
}

export function MarkButton({
  flagged,
  onClick,
}: {
  flagged: boolean;
  onClick: () => void;
}) {
  return (
    <IconAction
      icon={flagged ? "📍" : "📌"}
      label={flagged ? "Unpin for reading" : "Pin for reading"}
      tone={flagged ? "danger" : "neutral"}
      pressed={flagged}
      onClick={onClick}
    />
  );
}
