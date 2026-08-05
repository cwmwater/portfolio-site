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

export function UserIcon({ className }: { className?: string }) {
  return base(
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </>,
    className
  )
}

export function CalendarIcon({ className }: { className?: string }) {
  return base(
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>,
    className
  )
}

export function MapPinIcon({ className }: { className?: string }) {
  return base(
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </>,
    className
  )
}

export function PhoneIcon({ className }: { className?: string }) {
  return base(
    <path d="M6 3h3l1.5 4.5L8.5 9.5a11 11 0 0 0 6 6l2-2L21 15v3a2 2 0 0 1-2 2C11.5 20 4 12.5 4 5a2 2 0 0 1 2-2Z" />,
    className
  )
}

export function MailIcon({ className }: { className?: string }) {
  return base(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </>,
    className
  )
}

export function CapIcon({ className }: { className?: string }) {
  return base(
    <>
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
    </>,
    className
  )
}
