"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateLeadStatus(id: string, status: string) {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const validStatuses = ["new", "confirmed", "assigned", "active", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
        return { error: "Invalid status" };
    }

    const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (status === "confirmed") {
        updateData.confirmed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", id);

    if (error) {
        console.error("Error updating lead status:", error);
        return { error: "Failed to update status" };
    }

    revalidatePath("/dashboard/leads");
    revalidatePath(`/dashboard/leads/${id}`);
    return { success: true };
}

export async function deleteServiceRequest(id: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("service_requests")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting service request:", error);
        return { error: "Failed to delete service request" };
    }

    revalidatePath("/dashboard/leads");
    return { success: true };
}

export async function resendInvoice(id: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Fetch the service request details
    const { data: sr, error: fetchError } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !sr) {
        return { error: "Service request not found" };
    }

    // Call the send-invoice API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
        const res = await fetch(`${baseUrl}/api/send-invoice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requestNumber: sr.request_number,
                customerName: sr.customer_name,
                customerEmail: sr.customer_email,
                customerPhone: sr.customer_phone,
                companyName: sr.company_name,
                serviceType: sr.service_type || "security",
                location: sr.location_address || "To be confirmed",
                numGuards: sr.num_guards || 1,
                durationHours: sr.duration_hours || 0,
                hourlyRate: sr.hourly_rate || 0,
                estimatedTotal: sr.estimated_total || 0,
                currency: sr.currency || "PKR",
                startDate: sr.start_date,
                startTime: sr.start_time,
                specialRequirements: sr.special_requirements,
            }),
        });

        if (!res.ok) {
            return { error: "Failed to send invoice" };
        }

        // Update invoice sent flags
        await supabase
            .from("service_requests")
            .update({
                invoice_sent_to_customer: true,
                invoice_sent_at: new Date().toISOString(),
            })
            .eq("id", id);

        revalidatePath(`/dashboard/leads/${id}`);
        return { success: true };
    } catch {
        return { error: "Failed to send invoice" };
    }
}
