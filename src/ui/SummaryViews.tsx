import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { TagChip, type ChipTone } from "./chips";
import { IconAction, SourceLink } from "./controls";
import { noteToneClasses, ui } from "../theme/classes";
import type { Note, ReadingStatus } from "../types";
import { NoteCard } from "./NoteCard";
import { READING_STATUS_LABEL } from "../lib/readingStatus";

export function SummaryHeader({
  backTo,
  paperTitle,
  sourceHref,
  onCopy,
  onExport,
}: {
  backTo: string;
  paperTitle: string;
  sourceHref?: string;
  onCopy: () => void;
  onExport: () => void;
}) {
  return (
    <div className={ui.readerHeader}>
      <div className={ui.readerHeaderLeft}>
        <IconAction to={backTo} icon="←" label="Back to reading" />
        <div className={ui.clip}>
          <h3 className={ui.readerHeaderTitle}>Notes & Summary</h3>
          <h2 className={ui.readerHeaderSub}>
            <SourceLink href={sourceHref}>{paperTitle}</SourceLink>
          </h2>
        </div>
      </div>
      <div className={ui.readerHeaderActions}>
        <IconAction icon="📋" label="Copy" onClick={onCopy} />
        <IconAction icon="⬇️" label="Export" onClick={onExport} />
      </div>
    </div>
  );
}

export function ColoredNotes({
  notes,
  onEdit,
  onDelete,
}: {
  notes: Note[];
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section>
      <h2 className={ui.summaryH}>All Notes ({notes.length})</h2>
      <div className={ui.stack}>
        {notes.map((n, i) => (
          <NoteCard
            key={n.id}
            note={n}
            toneClass={`${ui.summaryNote} ${noteToneClasses[i % noteToneClasses.length]}`}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

export function AiSummaryCard({
  summary,
  takeaways,
  refreshed,
}: {
  summary: string;
  takeaways: string;
  refreshed: boolean;
}) {
  return (
    <section className={ui.summaryCard}>
      <h2 className={ui.summaryCardH}>📝 AI-Generated Summary</h2>
      <p className={ui.summaryCardP}>
        {summary}
        {refreshed ? " (refreshed)" : ""}
      </p>
      <div className={ui.takeaways}>
        <p className={ui.muted}>
          <strong>Key Takeaways:</strong> {takeaways}
        </p>
      </div>
    </section>
  );
}

export function TagSection({
  tags,
  chipTone,
}: {
  tags: string[];
  chipTone: (tag: string) => ChipTone;
}) {
  return (
    <section>
      <h2 className={ui.summaryH}>Topics & Tags</h2>
      <div className={ui.chipRow}>
        {tags.map((t) => (
          <TagChip key={t} label={t} tone={chipTone(t)} />
        ))}
      </div>
    </section>
  );
}

export function QuickActions({
  compact,
  onCopy,
  onExport,
  onRegen,
}: {
  compact?: boolean;
  onCopy: () => void;
  onExport: () => void;
  onRegen: () => void;
}) {
  if (compact) {
    return (
      <section className={ui.mobileActions}>
        <h4 className={ui.railH}>Quick Actions</h4>
        <div className={ui.iconActionRow}>
          <IconAction icon="📋" label="Copy all notes" tone="primary" onClick={onCopy} />
          <IconAction icon="⬇️" label="Export" onClick={onExport} />
          <IconAction icon="🤖" label="Regenerate summary" onClick={onRegen} />
        </div>
      </section>
    );
  }
  return (
    <>
      <div className={ui.railHead}>
        <h4 className={ui.railHeadTitle}>Quick Actions</h4>
      </div>
      <div className={ui.iconActionRow}>
        <IconAction icon="📋" label="Copy all notes" tone="primary" onClick={onCopy} />
        <IconAction icon="📄" label="Export to doc" onClick={onExport} />
        <IconAction icon="🤖" label="Regenerate summary" onClick={onRegen} />
      </div>
    </>
  );
}

export function PaperInfo({
  status,
  noteCount,
  readTime,
}: {
  status: ReadingStatus;
  noteCount: number;
  readTime: string;
}) {
  return (
    <div className={ui.railSection}>
      <h4 className={ui.railH}>Paper Info</h4>
      <div className={ui.infoBlock}>
        <p className={ui.reset}>
          <strong>Status:</strong> {READING_STATUS_LABEL[status]}
        </p>
        <p className={ui.reset}>
          <strong>Added:</strong> Today
        </p>
        <p className={ui.reset}>
          <strong>Notes:</strong> {noteCount}
        </p>
        <p className={ui.reset}>
          <strong>Read Time:</strong> {readTime}
        </p>
      </div>
    </div>
  );
}

export function RelatedList({
  items,
}: {
  items: { id: string; title: string; blurb: string }[];
}) {
  return (
    <div className={ui.railBody}>
      <h4 className={ui.railH}>Related Papers</h4>
      <div className={ui.relatedStack}>
        {items.map((r) => (
          <Link key={r.id} to={`/notes/${r.id}`} className={ui.relatedCard}>
            <h4 className={ui.relatedTitle}>{r.title}</h4>
            <p className={ui.relatedMeta}>{r.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SummaryFrame({
  header,
  main,
  rail,
}: {
  header: ReactNode;
  main: ReactNode;
  rail: ReactNode;
}) {
  return (
    <div className={ui.page}>
      {header}
      <div className={ui.summarySplit}>
        <div className={ui.summaryMain}>
          <div className={ui.summaryInner}>{main}</div>
        </div>
        <aside className={ui.rail}>{rail}</aside>
      </div>
    </div>
  );
}
