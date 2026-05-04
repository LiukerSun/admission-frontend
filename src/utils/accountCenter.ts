export const ACCOUNT_CENTER_TABS = [
  'profile-security',
  'family-bindings',
  'membership-orders',
] as const

export type AccountCenterTab = (typeof ACCOUNT_CENTER_TABS)[number]

export const DEFAULT_ACCOUNT_CENTER_TAB: AccountCenterTab = 'profile-security'

const legacyRedirects: Record<string, AccountCenterTab> = {
  '/membership': 'membership-orders',
  '/orders': 'membership-orders',
  '/bindings': 'family-bindings',
}

export function isAccountCenterTab(value: string | null | undefined): value is AccountCenterTab {
  return ACCOUNT_CENTER_TABS.includes(value as AccountCenterTab)
}

export function getAccountCenterTab(value: string | null | undefined): AccountCenterTab {
  return isAccountCenterTab(value) ? value : DEFAULT_ACCOUNT_CENTER_TAB
}

export function toAccountCenterPath(tab: AccountCenterTab) {
  return `/profile?tab=${tab}`
}

export function getAccountCenterRedirect(pathname: string) {
  const tab = legacyRedirects[pathname]
  return tab ? toAccountCenterPath(tab) : null
}
