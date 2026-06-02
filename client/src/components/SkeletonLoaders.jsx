/**
 * Skeleton Loader Components
 * High-fidelity skeleton screens that match the actual component layouts
 */

export function StatCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl backdrop-blur-md border border-white/10 bg-white/5">
          <div className="h-4 bg-gray-700 rounded w-16 mb-4 animate-pulse"></div>
          <div className="h-8 bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export function ArenaCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl backdrop-blur-md border border-white/10 bg-white/5">
          <div className="h-5 bg-gray-700 rounded w-32 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-full mb-3 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-700 rounded w-24 animate-pulse"></div>
        <div className="h-9 bg-gray-700 rounded w-40 animate-pulse"></div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-gray-800 animate-pulse">
          <div className="w-12 h-8 bg-gray-700 rounded"></div>
          <div className="flex-1 ml-4 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-32"></div>
            <div className="h-3 bg-gray-700 rounded w-48"></div>
          </div>
          <div className="w-16 h-6 bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg backdrop-blur-md border border-white/10 bg-white/5 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-40"></div>
              <div className="h-3 bg-gray-700 rounded w-full"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
