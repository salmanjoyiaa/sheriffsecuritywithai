import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GuardsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-56 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
