/**
 * DashboardSkeleton — Loading skeleton for dashboard content
 * Shows while sessions and subscription data are being fetched
 */

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-slate-150 rounded-lg animate-pulse" />
        </div>

        {/* Trial Usage Card Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded-lg animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-150 rounded-lg animate-pulse" />
            <div className="h-2 w-full bg-slate-150 rounded-full animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-8 bg-slate-150 rounded-lg animate-pulse" />
              <div className="h-8 bg-slate-150 rounded-lg animate-pulse" />
              <div className="h-8 bg-slate-150 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-20 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        {/* Feedback Card Skeleton */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-start gap-4">
            <div className="h-6 w-6 bg-slate-200 rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-3 w-full bg-slate-150 rounded-lg animate-pulse" />
              <div className="h-3 w-5/6 bg-slate-150 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Session History Skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />

          {/* Skeleton rows */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-slate-200 rounded-lg animate-pulse" />
                  <div className="h-3 w-64 bg-slate-150 rounded-lg animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-slate-150 rounded-lg animate-pulse flex-shrink-0" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-48 bg-slate-150 rounded-lg animate-pulse" />
                <div className="h-3 w-20 bg-slate-150 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
