import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
