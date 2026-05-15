import { useCallback, useEffect, useRef, useState } from 'react'

interface SendCodeButtonProps {
  onSend: () => Promise<void>
  disabled?: boolean
  cooldownSeconds?: number
  idleLabel?: string
}

/**
 * Self-contained "get SMS code" button. After a successful send it locks for
 * `cooldownSeconds` and shows a live countdown. If onSend rejects, the lock is
 * released so the user can retry immediately.
 */
export default function SendCodeButton({
  onSend,
  disabled,
  cooldownSeconds = 60,
  idleLabel = '获取验证码',
}: SendCodeButtonProps) {
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => stopTimer, [stopTimer])

  const handleClick = useCallback(async () => {
    if (loading || remaining > 0 || disabled) return
    setLoading(true)
    try {
      await onSend()
      setRemaining(cooldownSeconds)
      timerRef.current = setInterval(() => {
        setRemaining((value) => {
          if (value <= 1) {
            stopTimer()
            return 0
          }
          return value - 1
        })
      }, 1000)
    } finally {
      setLoading(false)
    }
  }, [cooldownSeconds, disabled, loading, onSend, remaining, stopTimer])

  const isCounting = remaining > 0
  const isDisabled = disabled || loading || isCounting

  const label = isCounting
    ? `${remaining}s 后重发`
    : loading
      ? '发送中…'
      : idleLabel

  return (
    <button
      type="button"
      className={`send-code-btn${isCounting ? ' is-counting' : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {label}
    </button>
  )
}
