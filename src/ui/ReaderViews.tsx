import type { FormEvent, ReactNode } from "react";
import { IconAction, TextArea, TextField, SourceLink } from "./controls";
import { cx, ui } from "../theme/classes";
import type { Note } from "../types";
import { NoteCard } from "./NoteCard";

export function ReaderHeader({
  backTo,
  title,
  meta,
  sourceHref,
  pdfHref,
  pdfDownloadName,
  summaryHref,
  listenLabel,
  onListen,
  readLabel,
  onMarkRead,
}: {
  backTo: string;
  title: string;
  meta: string;
  sourceHref?: string;
  pdfHref?: string;
  pdfDownloadName?: string;
  summaryHref: string;
  listenLabel: string;
  onListen: () => void;
  readLabel: string;
  onMarkRead: () => void;
}) {
  const actions = (
    <>
      {pdfHref ? (
        <IconAction
          href={pdfHref}
          download={pdfDownloadName ?? true}
          icon="📄"
          label="Download PDF"
          tone="primary"
        />
      ) : null}
      <IconAction to={summaryHref} icon="📋" label="Summary" tone="summary" />
      <IconAction
        icon={listenLabel === "Pause" ? "⏸" : "🎧"}
        label={listenLabel}
        onClick={onListen}
      />
      <IconAction
        icon="✓"
        label={readLabel.replace(/^✓\s*/, "")}
        tone="success"
        onClick={onMarkRead}
      />
    </>
  );

  return (
    <>
      <div className={ui.readerHeader}>
        <div className={ui.readerHeaderLeft}>
          <IconAction to={backTo} icon="←" label="Back" />
          <div className={ui.readerHeaderMeta}>
            <h3 className={ui.readerHeaderTitle}>
              <SourceLink href={sourceHref}>{title}</SourceLink>
            </h3>
            <p className={ui.readerHeaderSub}>{meta}</p>
          </div>
        </div>
        <div className={cx(ui.readerHeaderActions, ui.onlyDesktopFlex)}>
          {actions}
        </div>
      </div>
      <div className={ui.readerMobileActions}>{actions}</div>
    </>
  );
}

export function ListenBar({
  playing,
  onToggle,
  status,
  progress,
  rate,
  liveTranscript,
  lastHeard,
  lastAction,
  micMuted,
  onMicMuted,
  micError,
  sttOk,
  command,
  onCommand,
  onSubmitCommand,
  micPermission,
  onRequestMic,
}: {
  playing: boolean;
  onToggle: () => void;
  status: string;
  progress: number;
  rate: number;
  liveTranscript: string;
  lastHeard: string;
  lastAction: string;
  micMuted: boolean;
  onMicMuted: () => void;
  micError: string | null;
  sttOk: boolean;
  command: string;
  onCommand: (v: string) => void;
  onSubmitCommand: () => void;
  micPermission: string;
  onRequestMic: () => void;
}) {
  const permLabel =
    micPermission === "granted"
      ? "Mic allowed"
      : micPermission === "denied"
        ? "Mic blocked"
        : micPermission === "unsupported"
          ? "Mic unsupported"
          : "Mic needs permission";

  return (
    <div className={ui.listenBar}>
      <div className={ui.listenRow}>
        <IconAction
          icon={playing ? "⏸" : "▶"}
          label={playing ? "Pause" : "Play"}
          tone="primary"
          onClick={() => {
            if (micPermission !== "granted") onRequestMic();
            onToggle();
          }}
        />
        <IconAction
          icon={micMuted ? "🔇" : "🎤"}
          label={
            micPermission === "granted"
              ? micMuted
                ? "Mic off"
                : "Mic on"
              : "Allow microphone"
          }
          onClick={() => {
            if (micPermission !== "granted") onRequestMic();
            else onMicMuted();
          }}
        />
        <div className={ui.listenTrack}>
          <div className={ui.listenFill} style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <span className={ui.listenTime}>{rate}×</span>
        <span className={ui.listenStatus}>{status}</span>
      </div>
      <p className={ui.listenMeta}>
        {permLabel}
        {liveTranscript
          ? ` · Hearing: ${liveTranscript}`
          : lastHeard
            ? ` · Heard: ${lastHeard}${lastAction ? ` — ${lastAction}` : ""}`
            : lastAction
              ? ` · ${lastAction}`
              : " · Say pause or hold, skip, take a note…, or mark as read."}
      </p>
      {micError && <p className={ui.listenWarn}>{micError}</p>}
      {!sttOk && !micError && micPermission !== "granted" && (
        <p className={ui.listenHelp}>
          Click Allow microphone so spoken instructions can be heard. If nothing happens, use the lock icon in the address bar and set Microphone to Allow.
        </p>
      )}
      <form
        className={ui.listenCmd}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitCommand();
        }}
      >
        <TextField
          variant="bar"
          value={command}
          onChange={(e) => onCommand(e.target.value)}
          placeholder="Type a command or note…"
        />
        <IconAction icon="➤" label="Go" tone="primary" type="submit" />
      </form>
      <p className={ui.listenHelp}>
        Try: “pause”, “hold”, “resume”, “next section”, “take a note: transformers drop recurrence”, “mark as read”, “help”.
      </p>
    </div>
  );
}

export function ArticleBody({
  title,
  authors,
  abstract,
  sections,
  activeUnitId,
  hasPdf,
}: {
  title: string;
  authors: string;
  abstract: string;
  sections: { heading: string; paragraphs: string[] }[];
  activeUnitId?: string | null;
  hasPdf?: boolean;
}) {
  const bodySections = hasPdf
    ? sections
    : sections.filter((s) => s.paragraphs.join(" ").trim() !== abstract.trim());
  return (
    <article className={ui.article}>
      <div className={ui.articleInner}>
        <h2 className={ui.articleTitle}>{title}</h2>
        <p className={ui.articleAuthors}>{authors}</p>
        {!hasPdf ? (
          <p className={ui.articleNotice}>
            No open-access PDF is available for this paper. The publisher page may have the full
            text.
          </p>
        ) : null}
        <h3 className={ui.articleH}>Abstract</h3>
        <p className={activeUnitId === "abstract" ? ui.articlePActive : ui.articleP}>
          {abstract}
        </p>
        {bodySections.map((s, si) => (
          <section key={`${s.heading}-${si}`}>
            <h3 className={ui.articleH}>{s.heading}</h3>
            {s.paragraphs.map((p, pi) => (
              <p
                key={`${si}-${pi}-${p.slice(0, 24)}`}
                className={
                  activeUnitId === `p-${si}-${pi}` ? ui.articlePActive : ui.articleP
                }
              >
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}

export function NotesPanel({
  notes,
  draft,
  onDraft,
  onSubmit,
  onEdit,
  onDelete,
}: {
  notes: Note[];
  draft: string;
  onDraft: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className={ui.notesAside}>
      <div className={ui.notesAsideHead}>
        <h4 className={ui.notesAsideTitle}>Notes</h4>
      </div>
      <div className={ui.notesList}>
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
      <form onSubmit={onSubmit} className={ui.noteFormRow}>
        <TextArea
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          placeholder="Add a note..."
        />
        <IconAction icon="➕" label="Add note" tone="primary" type="submit" />
      </form>
    </aside>
  );
}

export function ReaderFrame({
  header,
  listen,
  article,
  notes,
}: {
  header: ReactNode;
  listen?: ReactNode;
  article: ReactNode;
  notes: ReactNode;
}) {
  return (
    <div className={ui.page}>
      {header}
      {listen}
      <div className={ui.readerSplit}>
        {article}
        {notes}
      </div>
    </div>
  );
}
