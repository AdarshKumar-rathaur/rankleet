/**
 * Loading Component
 * Displays loading spinner with optional message
 */

function Loading({ message = "Loading...", fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin"></div>
      </div>
      {message && <p className="text-gray-400 text-sm">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        {content}
      </div>
    );
  }

  return <div className="flex justify-center py-10 text-white">{content}</div>;
}

export default Loading;

/**
 * Skeleton Loader Component
 * Shows placeholder while data is loading
 */
export function SkeletonLoader({ count = 3, height = "h-12" }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-800 rounded-lg animate-pulse`}
        ></div>
      ))}
    </div>
  );
}
