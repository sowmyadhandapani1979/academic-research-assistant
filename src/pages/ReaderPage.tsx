import { FormEvent, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useLibrary } from "../store/LibraryContext";
import {
  ArticleBody,
  ListenBar,
  NotesPanel,
  ReaderFrame,
  ReaderHeader,
} from "../ui/ReaderViews";
import { paperPdfFilename, paperPdfUrl, paperSourceUrl } from "../lib/source";
import { ui } from "../theme/classes";
import { useVoiceSession } from "../voice/useVoiceSession";

export function ReaderPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const listen = params.get("listen") === "1";
  const lib = useLibrary();
  const paper = lib.papers[id];
  const { startReading, cachePapers } = lib;
  const isRead = Boolean(lib.library.find((e) => e.paperId === id)?.isRead);
  const [draft, setDraft] = useState("");
  const [command, setCommand] = useState("");
  const [opening, setOpening] = useState(!paper);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setOpening((open) => open || !paper);
    void api
      .getPaper(id)
      .then((next) => {
        if (!cancelled) cachePapers([next]);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setOpening(false);
      });
    return () => {
      cancelled = true;
    };
    // Fetch once per paper id so a slow PDF load does not look like "not found".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, cachePapers]);

  useEffect(() => {
    if (paper) startReading(id);
  }, [id, paper, startReading]);

  const voice = useVoiceSession({
    paper,
    enabled: listen && Boolean(paper),
    onNote: (note) =>
      lib.addNote(id, note.content, {
        source: note.source,
        transcript: note.transcript,
        type: note.type,
        audioTimestamp: note.audioTimestamp,
      }),
    onMarkRead: (isRead) => lib.markRead(id, isRead),
    onVisual: () => {
      const next = new URLSearchParams(params);
      next.delete("listen");
      setParams(next);
    },
  });

  if (!paper) {
    if (opening) {
      return <p className={ui.notFound}>Opening paper…</p>;
    }
    return (
      <p className={ui.notFound}>
        Paper not found. <Link to="/library">Back to My Papers</Link>
      </p>
    );
  }

  function saveNote(e: FormEvent) {
    e.preventDefault();
    lib.addNote(id, draft, { source: "typed" });
    setDraft("");
    voice.pause();
  }

  function toggleListen() {
    const next = !listen;
    const nextParams = new URLSearchParams(params);
    if (next) {
      void (async () => {
        await voice.requestMic();
        nextParams.set("listen", "1");
        setParams(nextParams);
      })();
      return;
    }
    nextParams.delete("listen");
    setParams(nextParams);
  }

  const playing = voice.status === "speaking";

  return (
    <ReaderFrame
      header={
        <ReaderHeader
          backTo="/library"
          title={paper.title}
          meta={`${paper.authorsShort} · ${paper.year}`}
          sourceHref={paperSourceUrl(paper)}
          pdfHref={paperPdfUrl(paper)}
          pdfDownloadName={paperPdfFilename(paper)}
          summaryHref={`/notes/${paper.id}`}
          listenLabel={listen ? (playing ? "Pause" : "Listen") : "Listen"}
          onListen={listen ? voice.togglePlay : toggleListen}
          readLabel={isRead ? "✓ Read" : "✓ Mark as Read"}
          onMarkRead={() => lib.markRead(id, true)}
        />
      }
      listen={
        listen ? (
          <ListenBar
            playing={playing}
            onToggle={voice.togglePlay}
            status={voice.status}
            progress={voice.total ? (voice.index + 1) / voice.total : 0}
            rate={voice.rate}
            liveTranscript={voice.liveTranscript}
            lastHeard={voice.lastHeard}
            lastAction={voice.lastAction}
            micMuted={voice.micMuted}
            onMicMuted={() => voice.setMicMuted(!voice.micMuted)}
            micError={voice.micError}
            sttOk={voice.sttOk}
            command={command}
            onCommand={setCommand}
            onSubmitCommand={() => {
              if (!command.trim()) return;
              voice.handleTranscript(command.trim());
              setCommand("");
            }}
            micPermission={voice.micPermission}
            onRequestMic={() => {
              void voice.requestMic();
            }}
          />
        ) : undefined
      }
      article={
        <ArticleBody
          title={paper.title}
          authors={paper.authorsFull}
          abstract={paper.abstract}
          sections={paper.sections}
          activeUnitId={listen ? voice.activeUnitId : null}
          hasPdf={Boolean(paperPdfUrl(paper))}
        />
      }
      notes={
        <NotesPanel
          notes={lib.notesFor(id)}
          draft={draft}
          onDraft={(v) => {
            setDraft(v);
            voice.pause();
          }}
          onSubmit={saveNote}
          onEdit={(noteId, content) => lib.editNote(id, noteId, content)}
          onDelete={(noteId) => lib.deleteNote(id, noteId)}
        />
      }
    />
  );
}
