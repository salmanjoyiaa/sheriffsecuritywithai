"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Invoices page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="p-4 rounded-full bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Failed to load invoices</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Could not fetch invoice data. Please check your connection and try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try Again
      </Button>
    </div>
  );
}
