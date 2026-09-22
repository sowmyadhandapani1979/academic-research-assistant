import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { cx, ui } from "../theme/classes";

export type IconTone = "neutral" | "primary" | "success" | "summary" | "danger";

const iconTone = {
  neutral: ui.iconBtn,
  primary: cx(ui.iconBtn, ui.iconBtnPrimary),
  success: cx(ui.iconBtn, ui.iconBtnSuccess),
  summary: cx(ui.iconBtn, ui.iconBtnSummary),
  danger: cx(ui.iconBtn, ui.iconBtnDanger),
};

export function IconAction({
  icon,
  label,
  to,
  href,
  download,
  onClick,
  type = "button",
  tone = "neutral",
  className,
  pressed,
}: {
  icon: React.ReactNode;
  label: string;
  to?: string;
  href?: string;
  download?: boolean | string;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: IconTone;
  className?: string;
  pressed?: boolean;
}) {
  const classes = cx(iconTone[tone], className);
  const inner = (
    <>
      <span className={ui.iconBtnGlyph} aria-hidden>
        {icon}
      </span>
      <span className={ui.iconBtnTip}>{label}</span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        aria-label={label}
        title={label}
        className={classes}
        onClick={onClick}
        download={download === true ? "" : download}
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} aria-label={label} title={label} className={classes} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={classes}
    >
      {inner}
    </button>
  );
}

export function Button({
  variant = "ghost",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?:
    | "primary"
    | "ios"
    | "iosInline"
    | "play"
    | "mic"
    | "chip"
    | "chipMobile"
    | "ghost"
    | "ghostSm"
    | "summary"
    | "success"
    | "successSm"
    | "fullPrimary"
    | "fullIos"
    | "fullGhost"
    | "fullIosSm"
    | "fullGhostSm";
}) {
  const map = {
    primary: ui.btnPrimary,
    ios: ui.btnIos,
    iosInline: ui.btnIosInline,
    play: ui.btnPlay,
    mic: ui.btnMic,
    chip: ui.btnChip,
    chipMobile: ui.btnChipMobile,
    ghost: ui.btnGhost,
    ghostSm: ui.btnGhostSm,
    summary: ui.btnSummary,
    success: ui.btnSuccess,
    successSm: ui.btnSuccessSm,
    fullPrimary: ui.btnFullPrimary,
    fullIos: ui.btnFullIos,
    fullGhost: ui.btnFullGhost,
    fullIosSm: ui.btnFullIosSm,
    fullGhostSm: ui.btnFullGhostSm,
  };
  return <button type="button" className={cx(map[variant], className)} {...props} />;
}

export function TextLink({
  to,
  variant,
  children,
}: {
  to: string;
  variant:
    | "back"
    | "backSm"
    | "summary"
    | "summarySm"
    | "read"
    | "listen"
    | "notes"
    | "mobileRead"
    | "empty";
  children: React.ReactNode;
}) {
  const map = {
    back: ui.btnBack,
    backSm: ui.btnBackSm,
    summary: ui.btnSummary,
    summarySm: ui.btnSummarySm,
    read: ui.btnReadLink,
    listen: ui.btnListenLink,
    notes: ui.btnNotesLink,
    mobileRead: ui.btnMobileRead,
    empty: ui.emptyLink,
  };
  return (
    <Link to={to} className={map[variant]}>
      {children}
    </Link>
  );
}

export function TextField({
  variant = "bar",
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  variant?: "hero" | "bar" | "library" | "tag";
}) {
  const map = {
    hero: ui.input,
    bar: ui.inputBar,
    library: ui.inputLibrary,
    tag: ui.inputTag,
  };
  return <input className={cx(map[variant], className)} {...rest} />;
}

export function SelectField({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(ui.select, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(ui.textarea, className)} {...props} />;
}

export function SourceLink({
  href,
  children,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!href) return <>{children}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(ui.titleLink, className)}
    >
      {children}
    </a>
  );
}
