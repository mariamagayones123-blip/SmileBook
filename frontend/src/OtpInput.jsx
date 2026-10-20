import { useEffect, useRef } from 'react'

/**
 * Six separate boxes for a one-time code (OTP).
 * - digits only; typing moves to the next box
 * - Backspace clears and moves back; arrow keys move between boxes
 * - paste (or phone autofill) of the whole code fills every box
 * `value` is a plain string like "123456"; `onChange` receives the new string.
 */
export default function OtpInput({ value, onChange, length = 6, disabled = false, autoFocus = false, invalid = false }) {
  const refs = useRef([])
  const valueRef = useRef(value)   // always the newest value, even before React re-renders
  valueRef.current = value
  const focusBox = (i) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus()

  useEffect(() => { if (autoFocus) focusBox(0) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save the new code, then move the cursor. valueRef is updated first so the box we jump to
  // doesn't see the old value (which would send the cursor back).
  const commit = (next, focusIndex) => {
    valueRef.current = next
    onChange(next)
    if (focusIndex !== null) focusBox(focusIndex)
  }

  const handleChange = (i, e) => {
    const typed = e.target.value.replace(/\D/g, '')
    if (!typed) {                                        // box was cleared
      commit(value.slice(0, i) + value.slice(i + 1), null)
      return
    }
    if (typed.length === 1) {                            // normal typing: put the digit in this box
      commit((value.slice(0, i) + typed + value.slice(i + 1)).slice(0, length), i + 1)
      return
    }
    fillFrom(i, typed)                                   // autofill delivered several digits at once
  }

  const fillFrom = (i, digits) => {
    const next = (value.slice(0, i) + digits).slice(0, length)
    commit(next, next.length >= length ? length - 1 : next.length)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {   // empty box: delete the previous digit
      e.preventDefault()
      commit(value.slice(0, i - 1) + value.slice(i), i - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); focusBox(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); focusBox(i + 1)
    }
  }

  const handlePaste = (i, e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!digits) return
    e.preventDefault()
    fillFrom(digits.length >= length ? 0 : i, digits)    // a full code always starts from the first box
  }

  return (
    <div className="otp-group" role="group" aria-label={`${length}-digit code`}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          className={'otp-box' + (value[i] ? ' filled' : '')}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          value={value[i] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => {
            if (i > valueRef.current.length) focusBox(valueRef.current.length)  // don't skip empty boxes
            else e.target.select()
          }}
        />
      ))}
    </div>
  )
}
