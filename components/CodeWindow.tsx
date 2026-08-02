interface CodeWindowProps {
  filename: string
  children: React.ReactNode
  variant?: 'dark' | 'light'
}

export default function CodeWindow({ filename, children, variant = 'dark' }: CodeWindowProps) {
  return (
    <div className={`code-window ${variant === 'light' ? 'code-window--light' : ''}`}>
      <div className="code-window-bar">
        <span></span>
        <span></span>
        <span></span>
        <span className="filename">{filename}</span>
      </div>
      <div className="code-window-body">{children}</div>
    </div>
  )
}
