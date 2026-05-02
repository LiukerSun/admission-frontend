import { Button as AntButton } from 'antd'
import type { ButtonProps as AntButtonProps } from 'antd'
import type { CSSProperties } from 'react'
import { RADIUS_MAP } from '../_shared/types'
import type { BaseComponentProps, ComponentSize, RadiusToken, Tone } from '../_shared/types'
import { cn } from '../_shared/utils'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text' | 'link'

export interface ButtonProps
  extends Omit<BaseComponentProps, 'variant' | 'size' | 'loading'>,
    Omit<
      AntButtonProps,
      'children' | 'className' | 'danger' | 'disabled' | 'ghost' | 'loading' | 'size' | 'style' | 'type' | 'variant'
    > {
  /** Visual variant mapped onto Ant Design button types. */
  variant?: ButtonVariant
  /** Semantic tone. `danger` maps to Ant Design's danger state. */
  tone?: Tone
  /** Token-backed border radius applied inline for deterministic Ant Design overrides. */
  radius?: RadiusToken
  /** Optional opacity from 0 inclusive to 1 exclusive. */
  opacity?: number
  /** Local size scale mapped to Ant Design small, middle, and large sizes. */
  size?: ComponentSize
  /** Escape hatch for low-level Ant Design props that are not normalized by this wrapper. */
  antProps?: Omit<
    AntButtonProps,
    'children' | 'className' | 'danger' | 'disabled' | 'ghost' | 'loading' | 'size' | 'style' | 'type' | 'variant'
  >
  loading?: AntButtonProps['loading']
}

const buttonTypeByVariant: Record<ButtonVariant, AntButtonProps['type']> = {
  primary: 'primary',
  secondary: 'default',
  ghost: 'default',
  text: 'text',
  link: 'link',
}

const buttonSizeBySize: Record<ComponentSize, AntButtonProps['size']> = {
  sm: 'small',
  md: 'middle',
  lg: 'large',
}

function getOpacityStyle(opacity: number | undefined): CSSProperties {
  if (opacity === undefined || opacity < 0 || opacity >= 1) {
    return {}
  }

  return { opacity }
}

export function Button({
  antProps,
  children,
  className,
  disabled,
  loading,
  opacity,
  radius = 'sm',
  size = 'md',
  style,
  tone = 'brand',
  variant = 'primary',
  ...buttonProps
}: ButtonProps) {
  return (
    <AntButton
      autoInsertSpace={false}
      {...antProps}
      {...buttonProps}
      className={cn(styles.root, className)}
      danger={tone === 'danger'}
      disabled={disabled}
      ghost={variant === 'ghost'}
      loading={loading}
      size={buttonSizeBySize[size]}
      style={{
        ...style,
        borderRadius: RADIUS_MAP[radius],
        ...getOpacityStyle(opacity),
      }}
      type={buttonTypeByVariant[variant]}
    >
      {children}
    </AntButton>
  )
}

export default Button
