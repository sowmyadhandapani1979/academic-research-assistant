/** Visual class map. Restyle here (or tokens.css) — do not change page logic. */

export function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export const ui = {
  page: "flex-1 flex flex-col min-h-0 bg-transparent",
  scrollList: "flex-1 overflow-y-auto px-4 py-3 md:px-10 md:py-6 flex flex-col gap-3 md:gap-5",
  toolbar:
    "px-4 py-3 md:px-10 md:py-5 border-b border-line flex gap-2 md:gap-3 items-center",
  refineQuery: "flex-1 min-w-0",
  libraryToolbar: "px-4 py-3 md:px-10 md:py-6 border-b border-line",
  libraryTitle: "hidden md:block m-0 mb-5 text-2xl font-semibold",
  filterRow: "flex flex-col md:flex-row gap-2 md:gap-3 md:items-center",
  muted: "text-sm text-muted m-0",
  emptyLink: "text-accent",
  hero: "flex-1 flex flex-col justify-center items-center gap-8 md:gap-10 px-5 py-8 md:px-10",
  heroCopy: "text-center flex flex-col gap-3 md:gap-4",
  heroTitle: "m-0 text-[28px] md:text-[48px] font-bold text-ink",
  heroSubtitle: "m-0 text-[16px] md:text-[18px] text-muted font-normal",
  heroForm: "w-full max-w-[500px] md:max-w-[500px] flex flex-col gap-4 md:gap-5",
  heroRow: "flex gap-2 md:gap-3 items-stretch",
  heroAdvanced:
    "self-center hidden md:inline bg-transparent border-0 text-accent text-[13px] font-medium underline cursor-pointer p-0",
  hint: "hidden md:block m-0 text-xs text-hint text-center",
  recentsWrap: "w-full max-w-[500px] border-t border-line pt-4 md:pt-5",
  searchLayout: "flex-1 flex flex-col md:flex-row min-h-0",
  searchSidebar:
    "w-full md:w-[280px] shrink-0 bg-surface border-b md:border-b-0 md:border-r border-line px-4 py-3.5 md:px-6 md:py-8 flex flex-col gap-6 md:gap-8 overflow-y-auto",
  filterLabel:
    "m-0 mb-2 md:mb-4 text-[12px] md:text-[11px] font-semibold md:font-bold text-ink md:text-muted uppercase tracking-wide md:tracking-[0.8px]",
  disciplineChips: "flex flex-wrap md:flex-col gap-1.5 md:gap-2",
  disciplineChip:
    "px-3 py-2 md:px-3.5 border-[1.5px] md:border border-input-border rounded-full bg-surface text-[13px] md:text-sm text-ink cursor-pointer text-left",
  disciplineChipOn:
    "px-3 py-2 md:px-3.5 border-[1.5px] md:border border-ios md:border-accent rounded-full bg-ios md:bg-accent text-white text-[13px] md:text-sm cursor-pointer text-left",
  yearLabels: "flex gap-2 justify-between items-end mt-2",
  yearCaption: "m-0 text-[10px] text-hint",
  yearValue: "m-0 text-sm font-semibold text-accent",
  yearDash: "text-hint text-[10px] pb-0.5",
  dualSlider: "dual-slider relative h-10 flex items-center",
  recentsLabel: "m-0 mb-2.5 md:mb-3 text-[13px] text-muted font-medium md:font-semibold",
  recentsDesktop: "hidden md:flex flex-wrap gap-2",
  recentsMobile: "md:hidden flex flex-col gap-2",

  shell: "relative h-screen min-h-0 flex flex-col bg-[linear-gradient(135deg,var(--color-hero-from)_0%,var(--color-hero-to)_100%)]",
  themeGroup: "ml-auto flex items-center rounded-full bg-gray-btn p-0.5 w-fit",
  themeOption:
    "group relative inline-flex items-center justify-center w-8 h-8 rounded-full border-0 bg-transparent text-muted cursor-pointer",
  themeOptionOn:
    "group relative inline-flex items-center justify-center w-8 h-8 rounded-full border-0 bg-surface text-ink cursor-pointer shadow-sm",
  mobileHeader: "flex md:hidden items-center justify-between px-4 py-3 border-b border-line bg-transparent",
  mobileTitle: "m-0 text-[18px] font-bold",
  menuButton: "w-10 h-10 bg-transparent border-0 text-[20px] cursor-pointer",
  mobileMenu: "md:hidden border-b border-line bg-surface px-4 py-2 flex flex-col gap-1",
  mobileMenuLink: "py-2 text-ios no-underline",
  desktopNav: "flex px-4 md:px-10 py-3 md:py-4 border-b-2 border-accent gap-6 items-center bg-transparent",
  navLinkDesktop: "hidden md:inline",
  navLink: "text-[14px] no-underline px-3 py-2 transition-colors font-medium text-muted",
  navLinkActive: "text-[14px] no-underline px-3 py-2 transition-colors font-semibold text-accent border-b-[3px] border-accent",
  tabBar: "md:hidden flex justify-around py-3 border-t border-line bg-transparent",
  tab: "flex-1 flex flex-col items-center gap-0.5 text-center py-1 no-underline text-[11px] text-muted",
  tabActive:
    "flex-1 flex flex-col items-center gap-0.5 text-center py-1 no-underline text-[11px] text-ios font-semibold border-t-[3px] border-ios -mt-3 pt-2",
  main: "flex-1 min-h-0 flex flex-col",

  input:
    "flex-1 px-4 py-3.5 md:px-[18px] md:py-4 border-0 rounded-xl text-[15px] md:text-base bg-surface text-ink shadow-[var(--shadow-input)]",
  inputBar:
    "flex-1 px-3.5 py-2.5 md:px-4 md:py-3 border-0 bg-surface rounded-[10px] md:rounded-lg text-sm text-ink shadow-[var(--shadow-input)]",
  inputLibrary:
    "flex-1 px-3.5 py-2.5 md:px-4 md:py-2.5 border-0 md:border md:border-input-border bg-gray-btn md:bg-surface rounded-[10px] md:rounded-md text-sm md:max-w-[300px]",
  inputTag: "hidden md:block px-3 py-1.5 border border-input-border rounded text-xs w-[120px]",
  select:
    "px-3 py-2 border-0 md:border md:border-input-border bg-gray-btn md:bg-surface rounded-[10px] md:rounded-md text-[13px] md:text-sm",
  textarea:
    "w-full h-[70px] md:h-20 p-2 border border-input-border rounded-md text-xs resize-none box-border",

  iconBtn:
    "group relative inline-flex items-center justify-center w-11 h-11 shrink-0 border-0 rounded-full cursor-pointer no-underline bg-gray-btn text-ios",
  iconBtnPrimary: "bg-ios text-white",
  iconBtnSuccess: "bg-read-ok text-white",
  iconBtnSummary: "bg-gray-btn text-summary",
  iconBtnDanger: "bg-gray-btn text-flag",
  iconBtnActive: "ring-2 ring-accent",
  iconBtnGlyph: "text-[22px] leading-none",
  iconBtnTip:
    "pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] z-30 whitespace-nowrap rounded-md bg-ink text-on-ink text-[11px] font-medium px-2 py-1 opacity-0 shadow-sm group-hover:opacity-100 group-focus-visible:opacity-100",
  btnPrimary:
    "hidden md:inline-flex px-8 py-4 bg-accent text-white border-0 rounded-full text-base font-semibold cursor-pointer hover:bg-accent-hover",
  btnIos:
    "md:hidden w-full py-3.5 bg-ios text-white border-0 rounded-full text-[15px] font-semibold cursor-pointer",
  btnIosInline:
    "hidden md:inline-flex px-6 py-3 bg-ios text-white border-0 rounded-full text-sm font-medium cursor-pointer",
  btnPlay:
    "px-4 py-2 bg-ios text-white border-0 rounded-full text-sm font-medium cursor-pointer inline-flex",
  btnMic:
    "px-3 py-2 bg-gray-btn text-ios border-0 rounded-full text-xs font-medium cursor-pointer",
  btnChip: "px-3 py-2 bg-surface border border-input-border rounded-full text-sm text-ink cursor-pointer",
  btnChipMobile:
    "px-2.5 py-2.5 bg-surface border-0 rounded-full text-[13px] text-ink cursor-pointer text-left",
  btnGhost:
    "px-5 py-3 bg-gray-btn text-ios border-0 rounded-full text-[13px] font-medium cursor-pointer no-underline",
  btnGhostSm:
    "px-3.5 py-2.5 bg-gray-btn text-ios border-0 rounded-full text-xs font-medium cursor-pointer no-underline",
  btnSummary:
    "px-5 py-3 bg-gray-btn text-summary no-underline rounded-full text-[13px] font-medium",
  btnSummarySm:
    "px-3.5 py-2.5 bg-gray-btn text-summary no-underline rounded-full text-xs font-medium",
  btnSuccess:
    "px-5 py-3 bg-read-ok text-white border-0 rounded-full text-[13px] font-medium cursor-pointer",
  btnSuccessSm:
    "px-3.5 py-2.5 bg-read-ok text-white border-0 rounded-full text-xs font-medium cursor-pointer",
  btnBack:
    "px-4 py-2.5 bg-gray-btn rounded-full text-[13px] no-underline text-ios font-medium shrink-0",
  btnBackSm:
    "px-3.5 py-2.5 md:px-4 bg-gray-btn rounded-full text-xs md:text-[13px] no-underline text-ios font-medium shrink-0",
  btnFullPrimary:
    "w-full mt-2 py-2 bg-accent text-white border-0 rounded-full text-xs font-medium cursor-pointer",
  btnFullIos:
    "w-full py-3 bg-ios text-white border-0 rounded-full text-[13px] font-medium cursor-pointer",
  btnFullGhost:
    "w-full py-3 bg-gray-btn border-0 rounded-full text-[13px] text-ios font-medium cursor-pointer",
  btnFullIosSm:
    "w-full py-2.5 bg-ios text-white border-0 rounded-full text-xs font-medium cursor-pointer",
  btnFullGhostSm:
    "w-full py-2.5 bg-gray-btn border-0 rounded-full text-xs text-ios font-medium cursor-pointer",
  btnReadLink:
    "flex-1 md:flex-none text-center px-4 md:px-5 py-2.5 md:py-3 bg-ios text-white no-underline rounded-full text-xs md:text-[13px] font-medium",
  btnListenLink:
    "flex-1 md:flex-none text-center px-4 md:px-5 py-2.5 md:py-3 bg-gray-btn text-ios no-underline rounded-full text-xs md:text-[13px] font-medium",
  btnNotesLink:
    "flex-1 md:flex-none text-center px-4 md:px-5 py-2.5 md:py-3 bg-gray-btn text-summary no-underline rounded-full text-xs md:text-[13px] font-medium",
  btnMobileRead:
    "md:hidden block w-full py-2.5 bg-ios text-white text-center no-underline rounded-full text-xs font-medium",
  titleLink:
    "text-inherit no-underline hover:underline hover:text-ios",
  mark: "w-12 h-12 shrink-0 border-0 rounded-full text-[22px] cursor-pointer flex items-center justify-center",
  markOn: "bg-flag text-white",
  markOff: "bg-gray-btn text-muted",

  card: "border border-line rounded-xl md:rounded-lg p-4 md:p-6 bg-surface",
  cardHeader: "flex justify-between items-center mb-0 gap-2",
  cardTitle: "m-0 mb-1 md:mb-2 text-sm md:text-base font-semibold text-ink break-words",
  cardMeta: "m-0 text-xs md:text-[13px] text-muted",
  cardMetaRow: "flex flex-wrap gap-2 items-center",
  cardAbstract: "m-0 mt-3 mb-2.5 md:mb-3 text-xs md:text-[13px] text-body leading-relaxed break-words",
  accordionToggle:
    "group relative inline-flex items-center justify-center w-11 h-11 shrink-0 border-0 rounded-xl cursor-pointer bg-gray-btn text-ios",
  accordionChevron: "text-[28px] leading-none font-semibold",
  srOnly: "sr-only",
  tagRow: "flex gap-2 items-center flex-wrap mb-2.5 md:mb-0",
  chip: "inline-block px-2.5 py-1 rounded text-[12px] font-medium",
  chipBlue: "bg-chip text-chip-text",
  chipPurple: "bg-chip-purple text-chip-purple-text",
  chipOrange: "bg-chip-orange text-chip-orange-text",

  libraryList: "flex-1 overflow-y-auto px-4 py-3 md:px-10 md:py-5 flex flex-col gap-2.5 md:gap-3",
  libraryRow:
    "flex flex-col md:flex-row md:items-center p-3.5 md:p-4 rounded-xl md:rounded-md gap-2.5 md:gap-4 border bg-surface border-line",
  libraryRowUnread: "bg-amber-row border-amber-border",
  flagIcon: "hidden md:inline text-[20px]",
  flagDim: "opacity-30",
  rowTitleLine: "flex gap-2 items-start md:items-center mb-1 justify-between md:justify-start",
  rowTitle: "m-0 text-sm md:text-[15px] font-semibold text-ink",
  badge: "inline-block px-2 py-0.5 rounded text-[10px] md:text-[11px] font-medium shrink-0",
  badgeRead: "bg-read-bg text-read-text",
  badgeUnread: "bg-unread-bg text-unread-text",
  badgeProgress: "bg-chip-orange text-chip-orange-text",
  badgeFullText: "bg-read-bg text-read-text",
  badgeAbstract: "bg-unread-bg text-unread-text",
  rowActions: "flex gap-1.5 md:gap-2 items-center flex-wrap",
  onlyMobile: "md:hidden",
  onlyDesktop: "hidden md:inline",
  onlyDesktopBlock: "hidden md:block",
  onlyDesktopFlex: "hidden md:flex",
  grow: "flex-1 min-w-0",
  filterPills: "flex gap-2 overflow-x-auto",
  tagWrap: "flex gap-1.5 mt-2 flex-wrap",
  stack: "flex flex-col gap-2.5 md:gap-3",
  actionStack: "flex flex-col gap-2",
  iconActionRow: "flex gap-2 items-center flex-wrap p-3",
  relatedStack: "flex flex-col gap-2 text-[11px]",
  infoBlock: "text-xs text-muted leading-loose",
  reset: "m-0",
  chipRow: "flex gap-2 flex-wrap",
  clip: "min-w-0",

  readerHeader:
    "px-4 py-3 md:px-6 md:py-4 border-b border-line flex justify-between items-center gap-3",
  readerHeaderLeft: "flex gap-3 items-center min-w-0",
  readerHeaderMeta: "min-w-0",
  readerHeaderTitle: "m-0 text-base font-semibold truncate",
  readerHeaderSub: "m-0 mt-1 text-xs text-muted",
  readerHeaderActions: "flex gap-1.5 items-center",
  readerMobileActions: "md:hidden px-4 py-3 border-b border-line flex gap-2 flex-wrap",
  listenBar: "px-4 md:px-6 py-3 border-b border-line bg-nav flex flex-col gap-2",
  listenRow: "flex items-center gap-3 flex-wrap",
  listenTrack: "flex-1 min-w-[120px] h-1.5 bg-line rounded-full overflow-hidden",
  listenFill: "h-full bg-ios rounded-full",
  listenTime: "text-xs text-muted",
  listenStatus: "text-xs font-semibold text-accent uppercase tracking-wide",
  listenMeta: "text-xs text-muted",
  listenHelp: "m-0 text-[11px] text-hint",
  listenWarn: "m-0 text-[12px] text-flag font-medium",
  listenCmd: "flex gap-2 items-center",
  articlePActive: "m-0 mb-4 md:mb-6 text-[13px] md:text-sm text-ink leading-relaxed bg-chip rounded-md px-2 py-1 -mx-2",
  readerSplit: "flex flex-1 min-h-0 flex-col md:flex-row",
  article: "flex-1 min-h-0 overflow-y-auto p-4 md:p-6 md:border-r border-line",
  articleInner: "max-w-[700px] mx-auto w-full",
  articleTitle: "m-0 mb-2 md:mb-3 text-[20px] md:text-[28px] font-bold text-ink",
  articleAuthors: "m-0 mb-4 md:mb-6 text-xs md:text-[13px] text-muted",
  articleH: "mt-4 mb-2 md:mt-6 md:mb-3 text-sm md:text-base font-semibold",
  articleNotice: "m-0 mb-4 md:mb-5 text-[13px] md:text-sm text-muted leading-relaxed",
  articleP: "m-0 mb-4 md:mb-6 text-[13px] md:text-sm text-body leading-relaxed",
  notesAside:
    "md:w-[300px] md:border-l border-line bg-page flex flex-col border-t md:border-t-0 min-h-0",
  notesAsideHead: "px-4 py-4 border-b border-line bg-note-panel",
  notesAsideTitle: "m-0 text-[13px] font-semibold text-ink",
  notesList: "flex-1 overflow-y-auto p-4 flex flex-col gap-3",
  noteCard: "p-3 bg-surface border border-line rounded-md",
  noteText: "m-0 text-xs text-ink leading-snug",
  noteTime: "m-0 mt-2 text-[11px] text-hint",
  noteActions: "flex gap-2 mt-2",
  noteForm: "p-3 border-t border-line flex flex-col gap-2 items-start",
  noteFormRow: "p-3 border-t border-line flex flex-col gap-2 items-start",

  summarySplit: "flex flex-1 min-h-0 flex-col md:flex-row",
  summaryMain: "flex-1 overflow-y-auto p-4 md:p-6 md:border-r border-line",
  summaryInner: "max-w-[700px] mx-auto flex flex-col gap-8",
  summaryH: "m-0 mb-3 text-base md:text-xl font-bold",
  summaryNote:
    "p-3 md:p-4 border rounded-md",
  summaryNoteText: "m-0 mb-1.5 md:mb-2 text-xs md:text-[13px] text-ink leading-relaxed",
  summaryNoteTime: "m-0 text-[10px] md:text-[11px] text-hint",
  summaryCard: "p-3.5 md:p-5 bg-summary-card border-2 border-summary-border rounded-lg",
  summaryCardH: "m-0 mb-2.5 md:mb-3 text-sm md:text-lg font-bold text-summary-heading",
  summaryCardP: "m-0 mb-2.5 md:mb-3 text-xs md:text-[13px] text-body leading-relaxed",
  takeaways: "mt-2.5 p-2.5 md:p-3 bg-surface rounded border-l-4 border-summary-border",
  rail: "flex w-full md:w-[280px] border-t md:border-t-0 md:border-l border-line bg-nav flex-col",
  railHead: "p-4 border-b border-line",
  railHeadTitle: "m-0 text-xs font-bold text-ink uppercase tracking-wide",
  railBody: "p-4 flex flex-col gap-2",
  railSection: "p-4 border-y border-line",
  railH: "m-0 mb-3 text-xs font-bold text-ink",
  relatedCard: "p-2 bg-surface border border-input-border rounded no-underline",
  relatedTitle: "m-0 text-ink font-medium",
  relatedMeta: "m-0 mt-0.5 text-muted",
  mobileActions: "md:hidden pt-4 border-t border-line",
  notFound: "p-8 text-muted",
} as const;

export const noteToneClasses = [
  "bg-note-a border-note-a-border",
  "bg-note-b border-note-b-border",
  "bg-note-c border-note-c-border",
] as const;
