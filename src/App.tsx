import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { LibraryPage } from "./pages/LibraryPage";
import { NotesPage } from "./pages/NotesPage";
import { ReaderPage } from "./pages/ReaderPage";
import { ResultsPage } from "./pages/ResultsPage";
import { SearchPage } from "./pages/SearchPage";
import { LibraryProvider } from "./store/LibraryContext";
import { ThemeProvider } from "./theme/ThemeProvider";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<SearchPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
        <Route path="/notes/:id" element={<NotesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LibraryProvider>
    </ThemeProvider>
  );
}
