import type { CSSProperties } from 'react'
import { cn } from '../_shared/utils'
import styles from './LoadingSkeleton.module.css'

export type LoadingSkeletonVariant = 'text' | 'card' | 'chart' | 'table' | 'custom'

export interface LoadingSkeletonProps {
  variant?: LoadingSkeletonVariant
  rows?: number
  width?: number | string
  height?: number | string
  className?: string
  style?: CSSProperties
}

function toCssLength(value: number | string | undefined) {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

function clampRows(rows: number | undefined, fallback: number) {
  if (rows === undefined) return fallback
  if (!Number.isFinite(rows) || rows <= 0) return fallback
  return Math.floor(rows)
}

export function LoadingSkeleton({
  className,
  height,
  rows,
  style,
  variant = 'text',
  width,
}: LoadingSkeletonProps) {
  if (variant === 'custom') {
    return (
      <div
        className={cn(styles.root, styles.variantCustom, className)}
        data-variant="custom"
        style={{
          ...style,
          width: toCssLength(width),
          height: toCssLength(height),
        }}
      />
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn(styles.root, styles.variantCard, className)} data-variant="card" style={style}>
        <div className={cn(styles.block, styles.line)} data-slot="title" />
        <div className={cn(styles.block, styles.cardBody)} data-slot="body" />
      </div>
    )
  }

  if (variant === 'chart') {
    return (
      <div className={cn(styles.root, styles.variantChart, className)} data-variant="chart" style={style}>
        <div className={cn(styles.block, styles.line)} data-slot="title" />
        <div className={cn(styles.block, styles.chartArea)} data-slot="chart" />
      </div>
    )
  }

  if (variant === 'table') {
    const resolvedRows = clampRows(rows, 5)

    return (
      <div className={cn(styles.root, styles.variantTable, className)} data-variant="table" style={style}>
        {Array.from({ length: resolvedRows }).map((_, index) => (
          <div className={styles.tableRow} data-slot="row" key={index}>
            <div className={cn(styles.block, styles.tableCell)} data-slot="cell" />
            <div className={cn(styles.block, styles.tableCell)} data-slot="cell" />
            <div className={cn(styles.block, styles.tableCell)} data-slot="cell" />
          </div>
        ))}
      </div>
    )
  }

  const resolvedRows = clampRows(rows, 3)

  return (
    <div className={cn(styles.root, styles.variantText, className)} data-variant="text" style={style}>
      {Array.from({ length: resolvedRows }).map((_, index) => (
        <div
          className={cn(styles.block, styles.line)}
          data-slot="line"
          key={index}
          style={{ width: `${Math.max(60, 100 - index * 8)}%` }}
        />
      ))}
    </div>
  )
}

export default LoadingSkeleton
