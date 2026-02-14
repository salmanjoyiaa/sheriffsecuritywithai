import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function InvoicesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-56 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="space-y-1">
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
