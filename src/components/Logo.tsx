export function Mark() {
  return (
    <span className="grid size-9 place-items-center rounded-xl bg-[#b7d7c5] text-[#173d2a]">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M5 18.5 10 13l3 3 6-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 18.5h14" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function Logo({ onClick }: { onClick?: () => void }) {
  const content = (
    <div className="flex items-center gap-3">
      <Mark />
      <span className="text-lg font-semibold tracking-[-0.03em] text-[#173d2a]">SFP</span>
    </div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="cursor-pointer transition-opacity hover:opacity-80">
        {content}
      </button>
    )
  }

  return content
}
