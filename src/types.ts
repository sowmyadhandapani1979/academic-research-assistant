export type Paper = {
  id: string;
  title: string;
  authorsShort: string;
  authorsFull: string;
  year: number;
  abstract: string;
  sections: { heading: string; paragraphs: string[] }[];
  tagsPalette?: Record<string, "blue" | "purple" | "orange">;
  related: { id: string; blurb: string }[];
  summary: string;
  takeaways: string;
  readTime: string;
  url?: string;
  pdfUrl?: string;
  doi?: string;
  pdfIngested?: boolean;
  source?: string;
  fieldsOfStudy?: string[];
};

export type NoteSource = "typed" | "voice";
export type NoteKind = "user_note" | "voice_command" | "system_insight";

export type Note = {
  id: string;
  paperId: string;
  content: string;
  createdAt: number;
  audioTimestamp?: number;
  source?: NoteSource;
  transcript?: string;
  type?: NoteKind;
};

export type ReadingStatus = "in_progress" | "yet_to_start" | "read";

export type LibraryEntry = {
  paperId: string;
  tags: string[];
  isRead: boolean;
  flagged: boolean;
  markedAt: number;
  readingStatus: ReadingStatus;
};

export type SpeechUnit = {
  id: string;
  kind: "title" | "abstract" | "heading" | "paragraph";
  heading?: string;
  text: string;
};
