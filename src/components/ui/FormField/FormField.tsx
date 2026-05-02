import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../_shared/utils'
import styles from './FormField.module.css'

export type FormFieldLayout = 'vertical' | 'horizontal'

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: ReactNode
  required?: boolean
  helpText?: ReactNode
  error?: ReactNode
  layout?: FormFieldLayout
  htmlFor?: string
  hiddenLabel?: boolean
  children: ReactNode
  className?: string
  style?: CSSProperties
}

const layoutClassName: Record<FormFieldLayout, string> = {
  vertical: styles.layoutVertical,
  horizontal: styles.layoutHorizontal,
}

export function FormField({
  children,
  className,
  error,
  helpText,
  hiddenLabel = false,
  htmlFor,
  label,
  layout = 'vertical',
  required = false,
  style,
  ...divProps
}: FormFieldProps) {
  const showError = Boolean(error)
  const showHelp = Boolean(helpText)

  return (
    <div {...divProps} className={cn(styles.root, layoutClassName[layout], className)} style={style}>
      {label ? (
        <label className={cn(styles.label, hiddenLabel && styles.visuallyHidden)} data-slot="label" htmlFor={htmlFor}>
          <span className={styles.labelText}>{label}</span>
          {required ? (
            <span aria-hidden="true" className={styles.requiredMark} data-slot="required">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <div className={styles.control} data-slot="control">
        {children}
      </div>
      {showHelp ? (
        <div className={styles.helpText} data-slot="help">
          {helpText}
        </div>
      ) : null}
      {showError ? (
        <div className={styles.error} data-slot="error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default FormField
