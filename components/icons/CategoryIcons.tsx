function base(children: React.ReactNode, className?: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export function LanguageIcon({ className }: { className?: string }) {
  return base(<path d="M9 8 4 12l5 4M15 8l5 4-5 4" />, className)
}

export function BackendIcon({ className }: { className?: string }) {
  return base(
    <>
      <rect x="3.5" y="4.5" width="17" height="6" rx="1.5" />
      <rect x="3.5" y="13.5" width="17" height="6" rx="1.5" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </>,
    className
  )
}

export function FrontendIcon({ className }: { className?: string }) {
  return base(
    <>
      <rect x="3" y="4.5" width="18" height="13" rx="1.5" />
      <path d="M3 8.5h18M9 21h6M12 17.5V21" />
    </>,
    className
  )
}

export function DataAIIcon({ className }: { className?: string }) {
  return base(
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </>,
    className
  )
}

export function InfraIcon({ className }: { className?: string }) {
  return base(
    <path d="M7 18a4 4 0 0 1-.6-7.95A5 5 0 0 1 16 8.2 4.5 4.5 0 0 1 17.5 18H7Z" />,
    className
  )
}

export function GameIcon({ className }: { className?: string }) {
  return base(
    <>
      <path d="M6 9h12a4 4 0 0 1 4 4.5c0 1.9-1.3 3-2.7 3-1 0-1.6-.5-2.3-1.3L15.5 13h-7L6.9 15.2C6.2 16 5.6 16.5 4.6 16.5c-1.4 0-2.7-1.1-2.7-3A4 4 0 0 1 6 9Z" />
      <path d="M7.5 11v2.5M6.25 12.25h2.5M16 12h.01M18 13.5h.01" />
    </>,
    className
  )
}

export const CATEGORY_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  Language: LanguageIcon,
  Backend: BackendIcon,
  Frontend: FrontendIcon,
  'Data / AI': DataAIIcon,
  Infra: InfraIcon,
  Game: GameIcon,
}
