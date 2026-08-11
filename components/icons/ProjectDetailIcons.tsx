function base(children: React.ReactNode, className?: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export function SummaryIcon({ className }: { className?: string }) {
  return base(
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>,
    className
  )
}

export function BackgroundIcon({ className }: { className?: string }) {
  return base(
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
    </>,
    className
  )
}

export function ImageIcon({ className }: { className?: string }) {
  return base(
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 4.5-4.5c.6-.6 1.4-.6 2 0L15 16l1.2-1.2c.6-.6 1.4-.6 2 0L20.5 17" />
    </>,
    className
  )
}

export function MeaningIcon({ className }: { className?: string }) {
  return base(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>,
    className
  )
}
