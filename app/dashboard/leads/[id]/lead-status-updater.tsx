"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateLeadStatus, resendInvoice } from "../actions";
import { RefreshCcw, Send, Loader2 } from "lucide-react";

interface LeadStatusUpdaterProps {
    id: string;
    currentStatus: string;
}

const statuses = [
    { value: "new", label: "New" },
    { value: "confirmed", label: "Confirmed" },
    { value: "assigned", label: "Assigned" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

export function LeadStatusUpdater({ id, currentStatus }: LeadStatusUpdaterProps) {
    const [status, setStatus] = useState(currentStatus);
    const [isPending, startTransition] = useTransition();
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleStatusUpdate = () => {
        if (status === currentStatus) return;

        startTransition(async () => {
            const result = await updateLeadStatus(id, status);
            if (result.error) {
                setMessage(`Error: ${result.error}`);
            } else {
                setMessage("Status updated successfully!");
                setTimeout(() => setMessage(null), 3000);
            }
        });
    };

    const handleResendInvoice = async () => {
        setIsResending(true);
        setMessage(null);
        try {
            const result = await resendInvoice(id);
            if (result.error) {
                setMessage(`Error: ${result.error}`);
            } else {
                setMessage("Invoice resent successfully!");
                setTimeout(() => setMessage(null), 3000);
            }
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCcw className="h-5 w-5 text-primary" />
                    Actions
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status update */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Update Status</label>
                    <div className="flex gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleStatusUpdate}
                            disabled={isPending || status === currentStatus}
                            size="sm"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Resend invoice */}
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResendInvoice}
                    disabled={isResending}
                >
                    {isResending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Send className="h-4 w-4 mr-2" />
                    )}
                    Resend Invoice Email
                </Button>

                {/* Message */}
                {message && (
                    <p
                        className={`text-sm ${message.startsWith("Error") ? "text-red-600" : "text-green-600"}`}
                    >
                        {message}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
