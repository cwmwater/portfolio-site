export default function Footer({ phone }: { phone?: string | null }) {
  return (
    <footer className="border-t border-white/10 bg-dark pb-10 pt-8 font-mono text-[0.8rem] text-muted-light" id="contact">
      <div className="mx-auto flex max-w-[880px] flex-wrap items-center justify-between gap-3 px-6">
        <span>© {new Date().getFullYear()} Wonmin Choi</span>
        <div className="flex flex-wrap gap-4">
          {phone && <span>{phone}</span>}
          <a href="mailto:jo08198@gmail.com" className="hover:text-accent">
            jo08198@gmail.com
          </a>
        </div>
      </div>
    </footer>
  )
}
