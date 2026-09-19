import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLibrary, usePaper } from "../store/LibraryContext";
import {
  AiSummaryCard,
  ColoredNotes,
  PaperInfo,
  QuickActions,
  RelatedList,
  SummaryFrame,
  SummaryHeader,
  TagSection,
} from "../ui/SummaryViews";
import { paperSourceUrl } from "../lib/source";
import { ui } from "../theme/classes";
import { normalizeReadingStatus } from "../lib/readingStatus";

export function NotesPage() {
  const { id = "" } = useParams();
  const paper = usePaper(id);
  const { notesFor, tagsFor, library, papers, editNote, deleteNote } = useLibrary();
  const [summaryTick, setSummaryTick] = useState(0);
  const notes = notesFor(id);
  const tags = tagsFor(id);
  const entry = library.find((e) => e.paperId === id);

  const copiedLabel = useMemo(
    () => notes.map((n) => n.content).join("\n\n"),
    [notes],
  );

  if (!paper) {
    return (
      <p className={ui.notFound}>
        Paper not found. <Link to="/library">Back to My Papers</Link>
      </p>
    );
  }

  const current = paper;

  async function copyAll() {
    await navigator.clipboard.writeText(copiedLabel);
  }

  function exportTxt() {
    const blob = new Blob(
      [
        `${current.title}\n${current.authorsFull}\n\nNotes\n\n${notes
          .map((n) => `- ${n.content}`)
          .join("\n")}\n\nSummary\n${current.summary}\n`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current.id}-notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const displayTags = tags.length ? tags : Object.keys(paper.tagsPalette ?? {});
  const chipTone = (t: string) => paper.tagsPalette?.[t] ?? "blue";

  return (
    <SummaryFrame
      header={
        <SummaryHeader
          backTo={`/read/${paper.id}`}
          paperTitle={paper.title}
          sourceHref={paperSourceUrl(paper)}
          onCopy={copyAll}
          onExport={exportTxt}
        />
      }
      main={
        <>
          <ColoredNotes
            notes={notes}
            onEdit={(noteId, content) => editNote(id, noteId, content)}
            onDelete={(noteId) => deleteNote(id, noteId)}
          />
          <AiSummaryCard
            summary={paper.summary}
            takeaways={paper.takeaways}
            refreshed={summaryTick > 0}
          />
          <TagSection tags={displayTags} chipTone={chipTone} />
          <QuickActions
            compact
            onCopy={copyAll}
            onExport={exportTxt}
            onRegen={() => setSummaryTick((n) => n + 1)}
          />
        </>
      }
      rail={
        <>
          <QuickActions
            onCopy={copyAll}
            onExport={exportTxt}
            onRegen={() => setSummaryTick((n) => n + 1)}
          />
          <PaperInfo
            status={normalizeReadingStatus(entry ?? { isRead: false })}
            noteCount={notes.length}
            readTime={paper.readTime}
          />
          <RelatedList
            items={paper.related.map((r) => ({
              id: r.id,
              title: papers[r.id]?.title.split(":")[0] ?? r.id,
              blurb: r.blurb,
            }))}
          />
        </>
      }
    />
  );
}
