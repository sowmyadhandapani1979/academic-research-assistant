# Academic Research Assistant - Product Requirements Document

## Executive Summary
An interactive web-based research assistant that helps academics discover, manage, and consume academic papers. Users can search for papers by topic, browse abstracts, mark papers for later study, tag them for organization, and then read papers or use **Listen** as a two-way voice partner: the system reads the paper aloud, hears spoken user input, and acts on it (pause, notes, navigation, and other reading commands).

## Product Vision
A collaborative research tool that serves as a partner throughout the research process - helping users find relevant papers, organize their research, and consume content in flexible formats (visual or **conversational voice**) while enabling active note-taking and knowledge consolidation. Listen mode is a complete voice model (speech in and speech out), not playback-only.

---

## Development Phases

### Phase 1: Basic Web App (Localhost, No Authentication)
- Core functionality deployed locally
- Single-user, no authentication required
- Foundation for future multi-user features
- Focus: Paper discovery, browsing, marking, visual reading, and Listen as a two-way voice model

### Phase 2: Multi-User Product (Authentication & Hosting)
- User authentication and sign-up
- Multi-user support
- Cloud deployment
- Persistent user data
- Google Docs integration for note storage

### Phase 3: Commercial Product
- Scalability enhancements
- Monetization features
- Enhanced analytics
- API for third-party integrations

---

## Functional Requirements - Phase 1

### 1. Paper Discovery & Search
- Users can enter a research topic or query
- System fetches papers from academic sources (Google Scholar, etc.)
- Display results as a list/card view with:
  - Paper title
  - Authors
  - Publication date
  - Abstract
  - Source/URL

### 2. Abstract Browsing & Interaction
- Users can browse abstracts interactively
- For each paper, users can:
  - Read the full abstract
  - Mark paper for later reading
  - Add custom tags (created on the fly as user types)
  - See if paper has already been read

### 3. Tagging System
- Create tags dynamically as user types
- Suggest previously used tags as user starts typing
- Multiple tags per paper
- Tags persist with paper metadata

### 4. Marked Papers Management
- Dedicated view for all marked papers
- Search functionality by:
  - Tag (filter by one or multiple tags)
  - Paper name/title
  - Author name
- Filter functionality by:
  - Tag
  - Read status (already read / not yet read)
- Visual indicator (red mark/flag) for papers marked for reading
- Track read/unread status for each paper

### 5. Paper Reading Experience
- Two reading modes:
  - Visual mode: View paper content on screen
  - Listen mode: A **complete voice model** (not TTS-only). The assistant reads the paper aloud **and** continuously (or on barge-in) listens to the user, interprets intent, and acts.
- Seamless switching between visual and Listen modes without losing place, notes, or voice session state
- Support for PDF/text viewing plus spoken playback and spoken control

### 5a. Listen — two-way voice model (required)
Listen must behave like a reading partner, not a cassette player.

**Speak (output)**
- Read the current paper (or current section) aloud with play/pause, speed, and progress
- Spoken acknowledgements after acting on a command (e.g. “Paused.” / “Note saved.”)
- Optional: read back a note or a short answer about the current section

**Listen (input)**
- Capture user speech via the device microphone (explicit permission; visible mic state: idle / listening / processing)
- Support barge-in: talking over playback pauses reading and treats the utterance as a command or note
- Push-to-talk or always-listen-while-playing (always-listen is preferred in Listen mode once permission is granted)
- Show a live transcript of the last utterance so the user can correct it

**Act (commands the product must handle in Phase 1)**
- Playback: pause, resume, stop, skip ahead/back (sentence or section), change speed, repeat last paragraph
- Place: jump to abstract, introduction, a named section, or “start over”
- Notes: “take a note: …” or “remember that …” → save a time-stamped note on the paper
- Status: mark as read / mark as unread
- Mode: switch to visual reading
- Clarification: if intent is unclear, ask a short spoken (and on-screen) follow-up instead of ignoring the utterance
- Fallback: if the utterance is not a command, save it as a user note at the current audio timestamp

**Out of scope for Phase 1 (but schema-ready)**
- Open-ended Q&A over the full PDF with an LLM (Phase 2+). Phase 1 may use rule/intent matching plus optional local/cloud STT-TTS.

**Failure and privacy**
- If the mic is denied or STT is unavailable, Listen still reads aloud and shows a clear “voice commands unavailable — type instead” state
- Do not send audio off-device in Phase 1 unless the user opts into a cloud speech provider; prefer Web Speech API (`speechSynthesis` + `SpeechRecognition`) locally
- Never start the microphone except in Listen mode after consent

### 6. Note-Taking System
- Interactive note-taking while reading/listening (typed **or spoken** in Listen mode)
- Ability to pause reading at any point to take notes (including barge-in from voice)
- Two note-taking interfaces:
  - Interactive chat-like interface with assistant
  - Visual note editor/viewer
- Capture user thoughts, highlights, and instructions during reading
- Notes are linked to specific papers and time points

### 7. Note Consolidation
- Consolidate notes per individual paper
- Consolidate notes by topic/tag across multiple papers
- Prepare consolidated notes for export

### 8. Data Persistence (Phase 1: Local Storage)
- Store locally on browser (IndexedDB or similar)
- Persist across browser sessions:
  - Search history
  - Marked papers list
  - Tags
  - Notes
  - Read/unread status

---

## Non-Functional Requirements

### Security & Privacy
- Phase 1: No authentication needed
- Phase 2: Implement secure authentication (JWT or similar)
- Phase 2: Encrypt sensitive data at rest
- Phase 3: GDPR/privacy compliance

### Performance
- Paper search results load within 2-3 seconds
- Audio playback starts within 1 second
- Note saving is instantaneous
- UI remains responsive during background operations

### Scalability
- Phase 1: Optimized for single user
- Phase 2: Support concurrent multi-user access
- Phase 2: Database optimized for multiple users
- Phase 3: Horizontal scaling capability

### Reliability & Uptime
- Phase 1: No specific requirement (localhost)
- Phase 2: 99% uptime SLA
- Phase 3: 99.9% uptime SLA
- Automated backups of user data

### API Rate Limiting
- Handle Google Scholar API rate limits gracefully
- Implement request queuing for paper fetches
- Cache results to minimize API calls
- Show user when rate limits are hit

### Audio / Voice Processing
- Low-latency text-to-speech conversion (playback starts within 1 second)
- Low-latency speech-to-text for commands and notes (barge-in acknowledged within ~500ms of end of speech when using on-device recognition)
- Support for different voice options (optional for Phase 1)
- Adjustable playback speed
- Audio continues seamlessly across sections after a handled command
- Microphone permission UX; no silent recording
- Graceful degradation to type-to-command if STT fails

### Data Persistence
- Phase 1: Browser local storage with backup capability
- Phase 2: Centralized database (PostgreSQL/MongoDB)
- Phase 2: Automated daily backups
- Phase 3: Multi-region redundancy

---

## Screen Flow & UI Specification - Phase 1

### Screen 1: Search Screen
**Purpose:** Initial entry point for topic research
**Components:**
- Search input field (prominent, main focus)
- Submit button ("Search" or "Find Papers")
- Optional: Recent search history dropdown
- Optional: Example search topics

**User Flow:**
1. User enters research topic (e.g., "machine learning transformers")
2. Clicks search
3. Navigates to Results Screen

---

### Screen 2: Results Screen
**Purpose:** Display papers found for the topic
**Components:**
- Search bar at top (allows refining search)
- Results displayed as cards, each containing:
  - Paper title (clickable for details)
  - Authors
  - Publication year
  - Abstract preview (truncated)
  - Mark button (to add to marked papers)
  - Tag input field (create/add tags on the fly)
  - Already tagged labels (visual chips)
- Pagination or infinite scroll
- Back button to search screen

**User Flow:**
1. User reviews papers in results
2. For papers of interest:
   - Reads abstract
   - Adds custom tags (typed on the fly)
   - Clicks mark button
3. Can refine search or proceed to marked papers

---

### Screen 3: Paper Detail Screen (Optional in Phase 1)
**Purpose:** View full abstract and details before marking
**Components:**
- Full paper metadata (title, authors, date, journal)
- Complete abstract
- Tag input (add/remove tags)
- Mark button
- Back button
- View full paper option (if URL available)

---

### Screen 4: Marked Papers View
**Purpose:** Manage and access all marked papers
**Components:**
- Search bar with multiple search options:
  - Search by paper name/title
  - Search by author
  - Search by tag
- Filter options:
  - Filter by tag (dropdown/multi-select)
  - Filter by read status (dropdown: "All / Read / Unread")
- List/card view of marked papers showing:
  - Paper title
  - Authors
  - Tags (visual chips)
  - Red mark/flag indicator (visual)
  - Read status badge ("Read" / "Unread")
- For each paper:
  - "Read" button (opens Paper Reading Screen in visual mode)
  - "Listen" button (opens Paper Reading Screen in Listen / voice-model mode)
  - "Edit Tags" button
  - "Delete" button (remove from marked list)

**User Flow:**
1. User views all marked papers
2. Can search/filter to find specific papers
3. Selects a paper to read or listen
4. Navigates to Paper Reading Screen

---

### Screen 5: Paper Reading Screen - Visual Mode
**Purpose:** Read paper content on screen with note-taking
**Components:**
- Paper header (title, authors, date)
- Paper content (PDF viewer or text display)
- Sidebar or bottom panel for notes:
  - Note input area
  - Previous notes display
  - "Save Note" button
  - "Mark as Read" button
- Controls:
  - Back button
  - Switch to Listen mode button
  - Pause/continue reading indicator

**User Flow:**
1. User reads paper content
2. Can pause at any time to take notes
3. Can see previous notes in sidebar
4. Can switch to Listen mode

---

### Screen 6: Paper Reading Screen - Listen Mode (voice model)
**Purpose:** Two-way voice reading: hear the paper, speak to the assistant, have it act
**Components:**
- Paper header (title, authors)
- Voice session status: **Speaking** (reading paper) / **Listening** (mic open) / **Thinking** (interpreting) / **Paused**
- Audio player:
  - Play/Pause button
  - Progress bar
  - Current time / Total duration
  - Playback speed control (optional)
  - Volume control
  - Mic toggle (mute voice commands without leaving Listen mode)
- Text display of current section being read (synchronized with audio)
- Last heard transcript + last action taken (e.g. “Heard: pause — Paused at §2”)
- Suggested voice commands (first-run or on “help”)
- Sidebar or bottom panel for notes:
  - Note input (type while listening **or** dictation from speech)
  - "Add Note" button
  - Previous notes display
  - Time-stamped notes (shows when note was taken during audio)
- Controls:
  - Back button
  - Switch to Visual mode button
  - Mark as Read button

**User Flow:**
1. User starts Listen; mic permission is requested if needed
2. Assistant reads the paper aloud; mic stays ready for barge-in
3. User speaks a command or note (or types)
4. Playback pauses (or ducks); system transcribes, acts, and confirms
5. Reading resumes from the correct place unless the command was stop/jump/switch mode
6. User can switch to visual mode or mark as read when done

---

### Screen 7: Note Consolidation View (Phase 1 Basic)
**Purpose:** View and manage consolidated notes
**Components:**
- View consolidated notes by:
  - Individual paper (shows all notes for one paper)
  - By topic/tag (shows notes from all papers with that tag)
- Export options (prepare for Google Docs in Phase 2):
  - Copy to clipboard
  - Download as text
- Navigation between papers/topics

**User Flow:**
1. User navigates to note consolidation
2. Can view notes by paper or by topic
3. Reviews consolidated content
4. Can export for further processing

---

## Data Models - Phase 1

### Paper Object
```
{
  id: string (unique identifier),
  title: string,
  authors: string[],
  publicationDate: string,
  abstract: string,
  source: string (Google Scholar, etc.),
  url: string,
  fullContent: string (optional, for later),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### MarkedPaper Object
```
{
  id: string,
  paperId: string (reference to Paper),
  tags: string[],
  isRead: boolean,
  readDate: timestamp (optional),
  markedDate: timestamp,
  notes: Note[]
}
```

### Note Object
```
{
  id: string,
  markedPaperId: string (reference to MarkedPaper),
  content: string,
  timestamp: timestamp,
  audioTimestamp: number (optional, seconds into audio),
  source: string (enum: "typed", "voice"),
  transcript: string (optional, raw STT text),
  type: string (enum: "user_note", "voice_command", "system_insight")
}
```

### SearchQuery Object (for history)
```
{
  id: string,
  query: string,
  results: Paper[],
  createdAt: timestamp
}
```

---

## Technical Specifications - Phase 1

### Architecture Overview
```
Frontend (React/Vue)
    ↓
Local State Management (localStorage/IndexedDB)
    ↓
Backend API (Node.js/Express)
    ↓
Paper Fetching Service (Google Scholar API)
Text-to-Speech Service (Web Speech API or similar)
```

### Frontend Stack (Recommended)
- Framework: React or Vue.js
- State Management: Context API or Pinia
- Styling: Tailwind CSS or styled-components
- UI Components: Material-UI or shadcn/ui
- HTTP Client: Axios or Fetch API

### Backend Stack (Recommended)
- Runtime: Node.js
- Framework: Express.js
- Database (Phase 1): IndexedDB (browser) or SQLite (local)
- Database (Phase 2): PostgreSQL or MongoDB
- APIs: Google Scholar API (or alternative academic paper source)

### Audio/Speech Services
- Text-to-Speech: Web Speech API (`speechSynthesis`) or ElevenLabs API
- Speech-to-Text: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) or a cloud STT provider (opt-in)
- Intent layer: map transcripts to playback, navigation, notes, and status actions (Phase 1); LLM understanding in Phase 2+
- Audio playback: HTML5 Audio API when using pre-rendered audio; Web Speech utterance queue when using TTS

### Local Storage Strategy (Phase 1)
- IndexedDB for structured data (papers, notes, marked papers)
- LocalStorage for user preferences
- Automatic sync to browser storage on every change

---

## API Endpoints - Phase 1 Backend

### Paper Search
```
GET /api/papers/search?query=<topic>&limit=20
Response: { papers: Paper[], total: number }
```

### Get Paper Details
```
GET /api/papers/:id
Response: Paper object
```

### Mark Paper
```
POST /api/marked-papers
Body: { paperId, tags: [] }
Response: MarkedPaper object
```

### Get Marked Papers
```
GET /api/marked-papers
Query: ?tags=tag1,tag2&search=query&readStatus=unread
Response: { markedPapers: MarkedPaper[], total: number }
```

### Add Note
```
POST /api/marked-papers/:id/notes
Body: { content, audioTimestamp, source?: "typed" | "voice", transcript?: string }
Response: Note object
```

### Voice command (Listen mode)
```
POST /api/voice/command
Body: { markedPaperId, transcript, audioTimestamp }
Response: { intent, action, confirmation, note?: Note }
```
Client-only in Phase 1 is acceptable; keep this shape so Phase 2 can move NLU server-side.

### Get Notes for Paper
```
GET /api/marked-papers/:id/notes
Response: Note[]
```

### Update Read Status
```
PATCH /api/marked-papers/:id
Body: { isRead: boolean }
Response: MarkedPaper object
```

### Get Consolidated Notes
```
GET /api/notes/consolidate
Query: ?by=paper|topic&filter=tag1,tag2
Response: { consolidated_notes: string }
```

---

## Implementation Priorities - Phase 1

### Priority 1 (MVP - Must Have)
1. Paper search and results display
2. Mark papers functionality
3. Marked papers list with search/filter
4. Tag system (creation and filtering)
5. Visual paper reading mode
6. Basic note-taking

### Priority 2 (Core Features)
1. Listen mode as a complete voice model (TTS + STT + command actions, not playback-only)
2. Read/unread status tracking
3. Note consolidation by paper
4. Local storage persistence

### Priority 3 (Polish & Enhancement)
1. Listen mode with synchronized text and barge-in polish
2. Note consolidation by topic
3. Search history
4. UI/UX refinements
5. Performance optimizations
6. Richer spoken Q&A over paper content (LLM)

---

## Known Constraints & Future Considerations

### Phase 1 Constraints
- No authentication = single user
- Browser storage limitations (typically 50MB IndexedDB limit)
- No real-time sync
- API rate limits on paper fetching
- Audio and voice commands may require internet (if using a third-party TTS/STT service)
- Browser Speech Recognition support varies; must degrade to typed commands
- Microphone access requires a user gesture and HTTPS in many browsers (localhost is OK for Phase 1)

### Future Enhancements (Phase 2+)
- Google Docs integration for note export
- Collaborative features (sharing papers/notes)
- AI-powered paper summarization
- Citation management
- Paper recommendation engine
- Mobile app (iOS/Android)
- Offline-first architecture

---

## Success Metrics - Phase 1

- Users can search and retrieve papers within 3 seconds
- Can tag and mark papers efficiently
- Can read papers with integrated notes
- Can listen to papers **and** control reading by voice (pause, notes, skip/jump, mark as read)
- Spoken commands are acknowledged and reflected in the UI (transcript + action)
- All data persists across browser sessions
- Smooth user experience without lag

---

## Notes for Implementation Team

1. Start with frontend mockup/wireframes before coding
2. Use component-based architecture for reusability
3. Implement proper error handling for API failures
4. Consider accessibility (ARIA labels, keyboard navigation)
5. Add loading states and user feedback
6. Log important user actions for debugging
7. Test thoroughly with sample papers before deployment
