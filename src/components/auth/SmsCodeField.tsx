import { useCallback, useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface SmsCodeFieldProps {
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  hasError?: boolean
  disabled?: boolean
  length?: number
}

/**
 * Segmented 6-digit OTP input. Each digit lives in its own cell with auto-
 * advance on type, auto-retreat on Backspace, and full-string paste support.
 */
export default function SmsCodeField({
  value = '',
  onChange,
  onComplete,
  hasError,
  disabled,
  length = 6,
}: SmsCodeFieldProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const digits = (() => {
    const arr = value.split('').slice(0, length)
    while (arr.length < length) arr.push('')
    return arr
  })()

  const emit = useCallback(
    (next: string[]) => {
      const joined = next.join('')
      onChange?.(joined)
      if (joined.length === length && next.every((d) => d !== '')) {
        onComplete?.(joined)
      }
    },
    [length, onChange, onComplete],
  )

  const focusCell = (idx: number) => {
    const cell = refs.current[idx]
    if (cell) {
      cell.focus()
      cell.select()
    }
  }

  const handleChange = (idx: number, ev: React.ChangeEvent<HTMLInputElement>) => {
    const raw = ev.target.value
    // The Chrome autocomplete-OTP path can dump the whole code into one cell.
    if (raw.length > 1) {
      const fill = raw.replace(/\D/g, '').slice(0, length).split('')
      const next = Array(length).fill('') as string[]
      fill.forEach((d, i) => { next[i] = d })
      emit(next)
      const lastFilled = Math.min(fill.length, length) - 1
      if (lastFilled >= 0) focusCell(Math.min(lastFilled + 1, length - 1))
      return
    }

    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = digit
    emit(next)

    if (digit && idx < length - 1) {
      focusCell(idx + 1)
    }
  }

  const handleKeyDown = (idx: number, ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Backspace') {
      if (digits[idx]) {
        // Allow the input's native behavior to clear the current cell.
        return
      }
      if (idx > 0) {
        ev.preventDefault()
        const next = [...digits]
        next[idx - 1] = ''
        emit(next)
        focusCell(idx - 1)
      }
    } else if (ev.key === 'ArrowLeft' && idx > 0) {
      ev.preventDefault()
      focusCell(idx - 1)
    } else if (ev.key === 'ArrowRight' && idx < length - 1) {
      ev.preventDefault()
      focusCell(idx + 1)
    }
  }

  const handlePaste = (ev: ClipboardEvent<HTMLInputElement>) => {
    const text = ev.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!text) return
    ev.preventDefault()
    const next = Array(length).fill('') as string[]
    text.split('').forEach((d, i) => { next[i] = d })
    emit(next)
    focusCell(Math.min(text.length, length - 1))
  }

  // When the parent clears the value (e.g. after a successful submit), put
  // focus back on the first cell so the user can retry without clicking.
  useEffect(() => {
    if (value === '' && !disabled) {
      refs.current[0]?.focus()
    }
  }, [value, disabled])

  return (
    <div className="otp-grid" role="group" aria-label="短信验证码">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => { refs.current[idx] = el }}
          className={[
            'otp-cell',
            d ? 'is-filled' : '',
            hasError ? 'is-error' : '',
          ].filter(Boolean).join(' ')}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={d}
          onChange={(ev) => handleChange(idx, ev)}
          onKeyDown={(ev) => handleKeyDown(idx, ev)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`验证码第 ${idx + 1} 位`}
        />
      ))}
    </div>
  )
}
