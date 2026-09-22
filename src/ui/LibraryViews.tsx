import type { ReactNode } from "react";
import type { ChipTone } from "./chips";
import { ContentBadge, StatusBadge, TagChip } from "./chips";
import { IconAction, SelectField, TextField, SourceLink } from "./controls";
import type { ReadingStatus } from "../lib/readingStatus";
import { cx, ui } from "../theme/classes";
import { Screen } from "./SearchHero";

export function LibraryToolbar({
  title,
  query,
  onQuery,
  tag,
  onTag,
  tags,
  status,
  onStatus,
  sort,
  onSort,
}: {
  title: string;
  query: string;
  onQuery: (v: string) => void;
  tag: string;
  onTag: (v: string) => void;
  tags: string[];
  status: string;
  onStatus: (v: string) => void;
  sort: string;
  onSort: (v: string) => void;
}) {
  return (
    <div className={ui.libraryToolbar}>
      <h2 className={ui.libraryTitle}>{title}</h2>
      <div className={ui.filterRow}>
        <TextField
          variant="library"
          className={ui.onlyDesktopBlock}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search by title, author..."
        />
        <TextField
          variant="library"
          className={ui.onlyMobile}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search..."
        />
        <div className={ui.filterPills}>
          <SelectField
            aria-label="Filter by tag"
            value={tag}
            onChange={(e) => onTag(e.target.value)}
          >
            <option value="all">All Tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </SelectField>
          <SelectField
            aria-label="Filter by read status"
            value={status}
            onChange={(e) => onStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="yet_to_start">Yet to Start</option>
            <option value="read">Read</option>
          </SelectField>
          <SelectField
            aria-label="Sort papers"
            value={sort}
            onChange={(e) => onSort(e.target.value)}
          >
            <option value="status">Reading status</option>
            <option value="newest">Recently saved</option>
            <option value="oldest">Oldest saved</option>
            <option value="tag">Tag</option>
          </SelectField>
        </div>
      </div>
    </div>
  );
}

export function LibraryItem({
  title,
  meta,
  readingStatus,
  tags,
  chipTone,
  openHref,
  listenHref,
  notesHref,
  sourceHref,
  onRemove,
  hasFullText,
}: {
  title: string;
  meta: string;
  readingStatus: ReadingStatus;
  tags: string[];
  chipTone: (tag: string) => ChipTone;
  openHref: string;
  listenHref: string;
  notesHref: string;
  sourceHref?: string;
  onRemove: () => void;
  hasFullText: boolean;
}) {
  return (
    <article
      className={cx(ui.libraryRow, readingStatus === "in_progress" && ui.libraryRowUnread)}
    >
      <div className={ui.grow}>
        <div className={ui.rowTitleLine}>
          <h3 className={ui.rowTitle}>
            <SourceLink href={sourceHref}>{title}</SourceLink>
          </h3>
          <ContentBadge hasFullText={hasFullText} />
          <StatusBadge status={readingStatus} />
        </div>
        <p className={ui.cardMeta}>{meta}</p>
        {tags.length > 0 && (
          <div className={ui.tagWrap}>
            {tags.map((t) => (
              <TagChip key={t} label={t} tone={chipTone(t)} />
            ))}
          </div>
        )}
      </div>
      <div className={ui.rowActions}>
        <IconAction to={openHref} icon="📖" label="Open" tone="primary" />
        <IconAction to={listenHref} icon="🎧" label="Listen" />
        <IconAction to={notesHref} icon="📋" label="Summary" tone="summary" />
        <IconAction
          icon="🗑"
          label={`Remove ${title}`}
          tone="danger"
          onClick={onRemove}
        />
      </div>
    </article>
  );
}

export function LibraryScreen({
  toolbar,
  empty,
  children,
}: {
  toolbar: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Screen>
      {toolbar}
      <div className={ui.libraryList}>
        {empty}
        {children}
      </div>
    </Screen>
  );
}
