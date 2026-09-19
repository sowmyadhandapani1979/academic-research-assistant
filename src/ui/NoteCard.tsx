import { useState } from "react";
import { IconAction, TextArea } from "./controls";
import { relativeTime } from "../lib/relativeTime";
import { cx, ui } from "../theme/classes";
import type { Note } from "../types";

export function NoteCard({
  note,
  toneClass,
  onEdit,
  onDelete,
}: {
  note: Note;
  toneClass?: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);

  function save() {
    const text = draft.trim();
    if (!text) return;
    onEdit(note.id, text);
    setEditing(false);
  }

  return (
    <div className={cx(toneClass ?? ui.noteCard)}>
      {editing ? (
        <>
          <TextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Edit note"
          />
          <div className={ui.noteActions}>
            <IconAction icon="✓" label="Save" tone="success" onClick={save} />
            <IconAction
              icon="✕"
              label="Cancel"
              onClick={() => {
                setDraft(note.content);
                setEditing(false);
              }}
            />
          </div>
        </>
      ) : (
        <>
          <p className={toneClass ? ui.summaryNoteText : ui.noteText}>{note.content}</p>
          <p className={toneClass ? ui.summaryNoteTime : ui.noteTime}>
            {relativeTime(note.createdAt)}
            {note.source === "voice" ? " · voice" : ""}
            {typeof note.audioTimestamp === "number" ? ` · #${note.audioTimestamp + 1}` : ""}
          </p>
          <div className={ui.noteActions}>
            <IconAction icon="✎" label="Edit" onClick={() => setEditing(true)} />
            <IconAction
              icon="🗑"
              label="Delete"
              tone="danger"
              onClick={() => onDelete(note.id)}
            />
          </div>
        </>
      )}
    </div>
  );
}
