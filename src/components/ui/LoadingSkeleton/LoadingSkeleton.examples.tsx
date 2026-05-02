import { LoadingSkeleton } from './LoadingSkeleton'

export function LoadingSkeletonExamples() {
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
      <LoadingSkeleton />
      <LoadingSkeleton rows={6} variant="text" />
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="chart" />
      <LoadingSkeleton rows={5} variant="table" />
      <LoadingSkeleton height={48} variant="custom" width={240} />
    </div>
  )
}
