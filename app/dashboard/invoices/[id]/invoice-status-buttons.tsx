"use client";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useTransition } from "react";

interface InvoiceStatusButtonsProps {
  invoiceId: string;
  status: string;
  updateStatus: (id: string, status: string) => Promise<{ error?: string; success?: boolean }>;
}

export function InvoiceStatusButtons({ 
  invoiceId, 
  status, 
  updateStatus 
}: InvoiceStatusButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleMarkAsSent = () => {
    startTransition(async () => {
      await updateStatus(invoiceId, "sent");
    });
  };

  const handleMarkAsPaid = () => {
    startTransition(async () => {
      await updateStatus(invoiceId, "paid");
    });
  };

  return (
    <>
      {status === "draft" && (
        <Button 
          variant="outline" 
          onClick={handleMarkAsSent}
          disabled={isPending}
        >
          <Send className="mr-2 h-4 w-4" />
          {isPending ? "Updating..." : "Mark as Sent"}
        </Button>
      )}
      {status === "sent" && (
        <Button 
          variant="default"
          onClick={handleMarkAsPaid}
          disabled={isPending}
        >
          {isPending ? "Updating..." : "Mark as Paid"}
        </Button>
      )}
    </>
  );
}
