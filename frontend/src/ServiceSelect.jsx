import { useEffect, useId, useMemo, useRef, useState } from 'react'

// Custom dropdown used instead of a native <select>.
// The native popup is drawn by the browser, so it can be wider than the card on phones.
// This one opens inside its own box, so it always fits the screen.
// groups: [{ label, options: [{ value, label, price }] }]
export default function ServiceSelect({ value, onChange, groups, placeholder = '-- choose a service --', disabled = false }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrapRef = useRef(null)
  const listRef = useRef(null)
  const baseId = useId()

  // Flat list (with the placeholder first) so arrow keys can move through everything.
  const flat = useMemo(() => {
    const items = [{ value: '', label: placeholder, price: null, isPlaceholder: true }]
    groups.forEach((g) => g.options.forEach((o) => items.push(o)))
    return items
  }, [groups, placeholder])

  const selectedIndex = flat.findIndex((o) => String(o.value) === String(value))
  const selected = selectedIndex > 0 ? flat[selectedIndex] : null

  const close = () => { setOpen(false); setActive(-1) }
  const openMenu = () => {
    if (disabled) return
    setOpen(true)
    setActive(selectedIndex >= 0 ? selectedIndex : 0)
  }
  const choose = (item) => {
    onChange(String(item.value))
    close()
    wrapRef.current?.querySelector('button.ss-trigger')?.focus()
  }

  // Close when tapping outside.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) close() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  // Keep the highlighted option visible while using the keyboard.
  useEffect(() => {
    if (!open || active < 0) return
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (e) => {
    if (disabled) return
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openMenu() }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(flat.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(flat.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (active >= 0) choose(flat[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'Tab') close()
  }

  let runningIndex = 0 // index 0 is the placeholder, options start at 1

  return (
    <div className="ss" ref={wrapRef}>
      <button
        type="button"
        className={`ss-trigger${open ? ' open' : ''}${selected ? '' : ' empty'}`}
        role="combobox"
        aria-label="Dental service"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${baseId}-list`}
        aria-activedescendant={open && active >= 0 ? `${baseId}-opt-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="ss-value">{selected ? `${selected.label} – ₱${Number(selected.price).toLocaleString()}` : placeholder}</span>
        <svg className="ss-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="ss-list" id={`${baseId}-list`} role="listbox" ref={listRef} tabIndex={-1}>
          <li
            id={`${baseId}-opt-0`}
            data-index={0}
            role="option"
            aria-selected={!selected}
            className={`ss-option ss-placeholder${active === 0 ? ' active' : ''}`}
            onMouseEnter={() => setActive(0)}
            onClick={() => choose(flat[0])}
          >
            {placeholder}
          </li>
          {groups.map((g) => (
            <li key={g.label} role="presentation" className={`ss-group${g.options.some((o) => String(o.value) === String(value)) ? ' has-selected' : ''}`}>
              <div className="ss-group-label" role="presentation">{g.label}</div>
              <ul role="group" aria-label={g.label}>
                {g.options.map((o) => {
                  runningIndex += 1
                  const idx = runningIndex
                  const isSel = String(o.value) === String(value)
                  return (
                    <li
                      key={o.value}
                      id={`${baseId}-opt-${idx}`}
                      data-index={idx}
                      role="option"
                      aria-selected={isSel}
                      className={`ss-option${isSel ? ' selected' : ''}${active === idx ? ' active' : ''}`}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => choose(o)}
                    >
                      <span className="ss-opt-name">
                        {isSel && (
                          <svg className="ss-check" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="11" fill="currentColor" />
                            <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {o.label}
                      </span>
                      {o.price != null && <span className="ss-opt-price">₱{Number(o.price).toLocaleString()}</span>}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}