import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({ children, onClose, titleId, descriptionId, className = 'card narrow' }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previousFocus = document.activeElement
    const dialog = dialogRef.current
    const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((element) => element.getClientRects().length > 0)
    ;(focusable[0] || dialog).focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const visibleFocusable = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((element) => element.getClientRects().length > 0)
      if (visibleFocusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = visibleFocusable[0]
      const last = visibleFocusable[visibleFocusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) previousFocus.focus()
    }
  }, [])

  return createPortal(
    <div className="modal">
      <div
        ref={dialogRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export function ConfirmModal({ title, message, confirmLabel, cancelLabel = 'Keep', busyLabel, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  const titleId = 'confirm-modal-title'
  const descriptionId = 'confirm-modal-description'

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} titleId={titleId} descriptionId={descriptionId}>
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{message}</p>
      <div className="modal-actions">
        <button className="btn ghost" type="button" disabled={busy} onClick={onClose}>{cancelLabel}</button>
        <button className="btn danger" type="button" disabled={busy} onClick={confirm}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}