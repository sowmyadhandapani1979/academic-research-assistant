import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppChrome } from "../ui/AppChrome";

export function AppShell() {
  const { pathname } = useLocation();
  const searchActive = pathname === "/" || pathname.startsWith("/results");
  const papersActive =
    pathname.startsWith("/library") ||
    pathname.startsWith("/read") ||
    pathname.startsWith("/notes");
  const isReader = pathname.startsWith("/read") || pathname.startsWith("/notes");
  const [menuOpen, setMenuOpen] = useState(false);

  const mobileTitle = pathname.startsWith("/results")
    ? "Results"
    : pathname.startsWith("/library")
      ? "My Papers"
      : "Papers";

  return (
    <AppChrome
      searchActive={searchActive}
      papersActive={papersActive}
      showMobileHeader={!isReader && pathname !== "/"}
      mobileTitle={mobileTitle}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen((v) => !v)}
      onCloseMenu={() => setMenuOpen(false)}
    />
  );
}
