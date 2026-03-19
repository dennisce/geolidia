import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

export function HelpTip({ text }: { text: string }) {
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const updatePos = () => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ top: r.bottom + 8, left: r.left, width: r.width })
  }

  useEffect(() => {
    if (!open) return
    updatePos()

    const onScroll = () => updatePos()
    const onResize = () => updatePos()

    // captura scroll de qualquer container (inclusive o overflow-auto)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
    }
  }, [open])

  const tooltip = useMemo(() => {
    if (!open || !pos) return null

    const W = 260
    const PAD = 12
    const vw = window.innerWidth
    const vh = window.innerHeight

    // tenta abrir alinhado ao "?".
    let left = pos.left
    // se estourar à direita, joga pra esquerda
    if (left + W + PAD > vw) left = Math.max(PAD, vw - W - PAD)

    // se estiver perto do topo/baixo, tenta limitar no viewport
    let top = pos.top
    if (top + 120 + PAD > vh) top = Math.max(PAD, vh - 120 - PAD)

    return createPortal(
      <div
        className="fixed z-[99999] w-[260px] rounded-xl border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-700 shadow-xl"
        style={{ top, left }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {text}
      </div>,
      document.body
    )
  }, [open, pos, text])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-[11px] font-semibold text-gray-500 shadow-sm"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="Ajuda"
      >
        ?
      </button>

      {tooltip}
    </>
  )
}
