import type { FormEvent } from "react";
import { ContentBadge, MarkButton, TagChip, type ChipTone } from "./chips";
import { IconAction, TextField, SourceLink } from "./controls";
import { scholarlyPlainText } from "../lib/plainText";
import { ui } from "../theme/classes";

export function RefineBar({
  value,
  onChange,
  onSubmit,
  filtersOpen,
  onToggleFilters,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className={ui.toolbar}>
      <TextField
        variant="bar"
        className={ui.refineQuery}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
      />
      <IconAction
        icon="⚙️"
        label="Filters"
        tone="primary"
        onClick={onToggleFilters}
        pressed={filtersOpen}
      />
      <IconAction icon="🔍" label="Search" tone="primary" type="submit" />
    </form>
  );
}

export function PaperResultCard({
  title,
  meta,
  abstract,
  flagged,
  tags,
  tagDraft,
  onTagDraft,
  onAddTag,
  onToggleFlag,
  readHref,
  sourceHref,
  chipTone,
  expanded,
  onToggleExpand,
  abstractId,
  hasFullText,
}: {
  title: string;
  meta: string;
  abstract: string;
  flagged: boolean;
  tags: string[];
  tagDraft: string;
  onTagDraft: (v: string) => void;
  onAddTag: (e: FormEvent) => void;
  onToggleFlag: () => void;
  readHref: string;
  sourceHref?: string;
  chipTone: (tag: string) => ChipTone;
  expanded: boolean;
  onToggleExpand: () => void;
  abstractId: string;
  hasFullText: boolean;
}) {
  return (
    <article className={ui.card}>
      <div className={ui.cardHeader}>
        <button
          type="button"
          className={ui.accordionToggle}
          aria-expanded={expanded}
          aria-controls={abstractId}
          aria-label={expanded ? "Hide abstract" : "Show abstract"}
          title={expanded ? "Hide abstract" : "Show abstract"}
          onClick={onToggleExpand}
        >
          <span className={ui.accordionChevron} aria-hidden>
            {expanded ? "-" : "+"}
          </span>
          <span className={ui.iconBtnTip}>{expanded ? "Hide abstract" : "Show abstract"}</span>
        </button>
        <div className={ui.grow}>
          <h3 className={ui.cardTitle}>
            <SourceLink href={sourceHref}>
              {scholarlyPlainText(title, 240)}
            </SourceLink>
          </h3>
          <div className={ui.cardMetaRow}>
            <p className={ui.cardMeta}>{meta}</p>
            <ContentBadge hasFullText={hasFullText} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <MarkButton flagged={flagged} onClick={onToggleFlag} />
          <IconAction to={readHref} icon="📖" label="Open" tone="primary" />
        </div>
      </div>
      {expanded && (
        <p id={abstractId} className={ui.cardAbstract}>
          {scholarlyPlainText(abstract, 800)}
        </p>
      )}
      <form onSubmit={onAddTag} className={ui.tagRow}>
        <TextField
          variant="tag"
          value={tagDraft}
          onChange={(e) => onTagDraft(e.target.value)}
          placeholder="+ Add tag"
        />
        {tags.map((t) => (
          <TagChip key={t} label={t} tone={chipTone(t)} />
        ))}
      </form>
    </article>
  );
}
