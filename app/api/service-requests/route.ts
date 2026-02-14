import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";
import type { Database } from "@/lib/supabase/types";

// Use service role client for unauthenticated context
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        // Rate limit by IP
        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "unknown";
        if (!rateLimit(ip, 5, 60 * 1000)) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                { status: 429 }
            );
        }

        const body = await req.json();

        const {
            customer_name,
            customer_email,
            customer_phone,
            company_name,
            service_type,
            location_address,
            location_city,
            location_state,
            num_guards,
            duration_hours,
            start_date,
            start_time,
            special_requirements,
            additional_notes,
            package_id,
            hourly_rate,
            estimated_total,
            ai_transcript,
        } = body;

        // Validate required fields
        if (!customer_name || !customer_email || !service_type || !location_address) {
            return NextResponse.json(
                { error: "Missing required fields: customer_name, customer_email, service_type, location_address" },
                { status: 400 }
            );
        }

        // Auto-match branch by city (case-insensitive)
        let branch_id: string | null = null;
        if (location_city) {
            const { data: matchedBranch } = await supabase
                .from("branches")
                .select("id")
                .ilike("city", location_city.trim())
                .limit(1)
                .single();

            if (matchedBranch) {
                branch_id = matchedBranch.id;
            }
        }

        // Insert service request
        const { data: serviceRequest, error } = await supabase
            .from("service_requests")
            .insert({
                branch_id,
                customer_name,
                customer_email,
                customer_phone: customer_phone || null,
                company_name: company_name || null,
                service_type,
                location_address,
                location_city: location_city || null,
                location_state: location_state || null,
                num_guards: num_guards || 1,
                duration_hours: duration_hours || null,
                start_date: start_date || null,
                start_time: start_time || null,
                special_requirements: special_requirements || [],
                additional_notes: additional_notes || null,
                package_id: package_id || null,
                hourly_rate: hourly_rate || null,
                estimated_total: estimated_total || null,
                ai_transcript: ai_transcript || null,
                source: "ai_voice",
                status: "new",
                priority: "normal",
            })
            .select("id, request_number, customer_name, customer_email, service_type, estimated_total, branch_id")
            .single();

        if (error) {
            console.error("Error creating service request:", error);
            return NextResponse.json(
                { error: "Failed to create service request" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            ...serviceRequest,
        });
    } catch (error) {
        console.error("Service request API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/** PATCH — Update email_status on a service request (public, rate-limited) */
export async function PATCH(req: NextRequest) {
    try {
        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        if (!rateLimit(ip, 10, 60 * 1000)) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const { id, email_status } = await req.json();

        if (!id || !email_status) {
            return NextResponse.json({ error: "id and email_status required" }, { status: 400 });
        }

        if (!["sent", "failed", "sending"].includes(email_status)) {
            return NextResponse.json({ error: "Invalid email_status" }, { status: 400 });
        }

        const { error } = await supabase
            .from("service_requests")
            .update({ email_status } as Record<string, unknown>)
            .eq("id", id);

        if (error) {
            console.error("Error updating email status:", error);
            return NextResponse.json({ error: "Update failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Service request PATCH error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
