import { NavLink, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { ui } from "../theme/classes";

export type AppChromeProps = {
  searchActive: boolean;
  papersActive: boolean;
  showMobileHeader: boolean;
  mobileTitle: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  children?: ReactNode;
};

export function AppChrome({
  searchActive,
  papersActive,
  showMobileHeader,
  mobileTitle,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
}: AppChromeProps) {
  const papersNav = papersActive && !searchActive;

  return (
    <div className={ui.shell}>
      {showMobileHeader && (
        <header className={ui.mobileHeader}>
          <h1 className={ui.mobileTitle}>{mobileTitle}</h1>
          <button
            type="button"
            className={ui.iconBtn}
            aria-label="Menu"
            onClick={onToggleMenu}
          >
            <span className={ui.iconBtnGlyph} aria-hidden>
              ☰
            </span>
            <span className={ui.iconBtnTip}>Menu</span>
          </button>
        </header>
      )}
      {menuOpen && (
        <div className={ui.mobileMenu}>
          <NavLink to="/" className={ui.mobileMenuLink} onClick={onCloseMenu}>
            Search
          </NavLink>
          <NavLink to="/library" className={ui.mobileMenuLink} onClick={onCloseMenu}>
            My Papers
          </NavLink>
        </div>
      )}

      <nav className={ui.desktopNav}>
        <NavLink to="/" className={searchActive ? ui.navLinkActive : ui.navLink}>
          🔍 Search
        </NavLink>
        <NavLink to="/library" className={papersNav ? ui.navLinkActive : ui.navLink}>
          📌 My Papers
        </NavLink>
      </nav>

      <div className={ui.main}>
        <Outlet />
      </div>

      <nav className={ui.tabBar}>
        <NavLink to="/" className={searchActive ? ui.tabActive : ui.tab}>
          <span aria-hidden>🔍</span>
          Search
        </NavLink>
        <NavLink to="/library" className={papersNav ? ui.tabActive : ui.tab}>
          <span aria-hidden>📌</span>
          My Papers
        </NavLink>
      </nav>
    </div>
  );
}
