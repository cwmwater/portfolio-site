interface CodeWindowProps {
  filename: string
  children: React.ReactNode
  variant?: 'dark' | 'light'
}

export default function CodeWindow({ filename, children, variant = 'dark' }: CodeWindowProps) {
  const isLight = variant === 'light'

  return (
    <div
      className={
        isLight
          ? 'overflow-hidden rounded-[10px] border border-border bg-white font-mono shadow-card'
          : 'overflow-hidden rounded-[10px] border border-border-dark bg-dark2 font-mono shadow-card-lg'
      }
    >
      <div
        className={
          isLight
            ? 'flex items-center gap-1.5 border-b border-border bg-[#f4f4f3] px-3.5 py-2.5'
            : 'flex items-center gap-1.5 border-b border-border-dark bg-[#171f1d] px-3.5 py-2.5'
        }
      >
        <span className={isLight ? 'h-2.5 w-2.5 rounded-full bg-[#d4d4d3]' : 'h-2.5 w-2.5 rounded-full bg-[#3a4442]'} />
        <span className={isLight ? 'h-2.5 w-2.5 rounded-full bg-[#d4d4d3]' : 'h-2.5 w-2.5 rounded-full bg-[#3a4442]'} />
        <span className={isLight ? 'h-2.5 w-2.5 rounded-full bg-[#d4d4d3]' : 'h-2.5 w-2.5 rounded-full bg-[#3a4442]'} />
        <span className={isLight ? 'ml-2 text-xs text-muted' : 'ml-2 text-xs text-muted-light'}>{filename}</span>
      </div>
      <div
        className={
          isLight
            ? 'px-5 py-[18px] font-sans text-[0.85rem] leading-[1.7] text-dark [&_.ln]:hidden'
            : 'px-5 py-[18px] text-[0.85rem] leading-[1.9] [&_.ln]:mr-3 [&_.ln]:select-none [&_.ln]:text-[#4b5654] [&_.str]:text-accent [&_.tag]:text-[#6ee7db]'
        }
      >
        {children}
      </div>
    </div>
  )
}
