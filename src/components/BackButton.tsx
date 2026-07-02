interface BackButtonProps {
  onClick: () => void;
  label?: string;
  /** Dark bar (quiz header) vs light screens */
  variant?: "dark" | "light";
}

export function BackButton({ onClick, label = "Back", variant = "light" }: BackButtonProps) {
  return (
    <button
      type="button"
      className={`back-btn back-btn--${variant}`}
      onClick={onClick}
      aria-label={label}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M12.5 15L7.5 10L12.5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
