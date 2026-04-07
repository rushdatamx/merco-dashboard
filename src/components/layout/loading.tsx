export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export function LoadingChart() {
  return (
    <div className="h-80 bg-card border border-border rounded-xl animate-pulse" />
  );
}

export function LoadingPage() {
  return (
    <div className="space-y-6 p-6">
      <LoadingGrid count={6} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingChart />
        <LoadingChart />
      </div>
    </div>
  );
}
