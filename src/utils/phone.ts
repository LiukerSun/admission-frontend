export function normalizeMainlandPhone(value: string) {
  const compact = value.trim().replace(/[\s\-()]/g, '')

  if (compact.startsWith('+86')) {
    return compact.slice(3)
  }

  if (compact.startsWith('86') && compact.length === 13) {
    return compact.slice(2)
  }

  return compact
}

export function isMainlandPhone(value: string) {
  return /^1[3-9]\d{9}$/.test(normalizeMainlandPhone(value))
}
