import { ui } from "../theme/classes";
import { THEME_PREFERENCES, type ThemePreference } from "../theme/preference";
import { useTheme } from "../theme/ThemeProvider";

const LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function ThemeIcon({ id }: { id: ThemePreference }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 16,
    height: 16,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (id === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2 4.8 4.8M19.2 19.2l-1.4-1.4M6.2 17.8l-1.4 1.4M19.2 4.8l-1.4 1.4" />
      </svg>
    );
  }
  if (id === "dark") {
    return (
      <svg {...common}>
        <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="4" y="5" width="16" height="12" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function ThemeSwitch() {
  const { preference, setPreference } = useTheme();

  return (
    <div role="radiogroup" aria-label="Theme" className={ui.themeGroup}>
      {THEME_PREFERENCES.map((id) => {
        const on = preference === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-label={LABELS[id]}
            title={LABELS[id]}
            aria-checked={on}
            className={on ? ui.themeOptionOn : ui.themeOption}
            onClick={() => setPreference(id)}
          >
            <ThemeIcon id={id} />
          </button>
        );
      })}
    </div>
  );
}
