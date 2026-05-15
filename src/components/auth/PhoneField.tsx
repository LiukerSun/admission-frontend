import { forwardRef, useCallback } from 'react'
import { normalizeMainlandPhone } from '@/utils/phone'

interface PhoneFieldProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(
  { value, onChange, placeholder = '请输入手机号', autoFocus, disabled, id, ...rest },
  ref,
) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Strip everything but digits; cap at 11 chars (mainland format).
      const next = event.target.value.replace(/\D/g, '').slice(0, 11)
      onChange?.(next)
    },
    [onChange],
  )

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      const raw = event.clipboardData.getData('text')
      const normalized = normalizeMainlandPhone(raw).replace(/\D/g, '').slice(0, 11)
      if (normalized) {
        event.preventDefault()
        onChange?.(normalized)
      }
    },
    [onChange],
  )

  return (
    <div className="phone-field">
      <span className="phone-field-prefix" aria-hidden="true">+86</span>
      <input
        ref={ref}
        id={id}
        className="phone-field-input"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={11}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={handleChange}
        onPaste={handlePaste}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-label={rest['aria-label'] ?? '手机号'}
      />
    </div>
  )
})

export default PhoneField
