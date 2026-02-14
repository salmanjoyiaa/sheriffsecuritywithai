import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// Lazy init to avoid build-time crash when env is missing
let _resend: Resend | null = null;
function getResend(): Resend {
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}
const OWNER_EMAIL = process.env.OWNER_EMAIL || "sheriffsgssc@gmail.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sheriffsecurity.pk";

/** Escape HTML special characters to prevent XSS in emails */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

interface InvoicePayload {
    requestNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    companyName?: string;
    serviceType: string;
    location: string;
    numGuards: number;
    durationHours: number;
    hourlyRate: number;
    estimatedTotal: number;
    currency: string;
    startDate?: string;
    startTime?: string;
    specialRequirements?: string[];
}

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limit
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        if (!rateLimit(ip, 5, 60 * 1000)) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body: InvoicePayload = await req.json();

        const serviceDetails = `
Service Type: ${escapeHtml(body.serviceType.toUpperCase())}
Location: ${escapeHtml(body.location)}
Guards Requested: ${body.numGuards}
Duration: ${body.durationHours} hours
Hourly Rate: ${escapeHtml(body.currency)} ${body.hourlyRate}/hr per guard
Start Date: ${body.startDate ? escapeHtml(body.startDate) : "To be confirmed"}
Start Time: ${body.startTime ? escapeHtml(body.startTime) : "To be confirmed"}
Special Requirements: ${body.specialRequirements?.map(r => escapeHtml(r)).join(", ") || "None"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTIMATED TOTAL: ${escapeHtml(body.currency)} ${Number(body.estimatedTotal).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

        // ──────────────────────────────────────────────
        // EMAIL 1: Customer Confirmation
        // ──────────────────────────────────────────────
        await getResend().emails.send({
            from: "Sheriff Security <onboarding@resend.dev>",
            to: body.customerEmail,
            subject: `Service Request ${body.requestNumber} — Confirmation`,
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🛡️ Sheriff Security Services</h1>
            <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Your Safety, Our Priority</p>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Service Request Confirmed</h2>
            <p style="color: #374151;">Dear <strong>${escapeHtml(body.customerName)}</strong>,</p>
            <p style="color: #374151;">Thank you for choosing Sheriff Security. Your service request <strong style="color: #dc2626;">${escapeHtml(body.requestNumber)}</strong> has been received and is being processed.</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #1a1a2e;">
              <h3 style="margin-top: 0; color: #1a1a2e;">📋 Service Details</h3>
              <pre style="white-space: pre-wrap; font-family: 'Segoe UI', Arial, sans-serif; color: #374151; margin: 0; font-size: 14px; line-height: 1.6;">${serviceDetails}</pre>
            </div>

            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⏰ <strong>Next Steps:</strong> Our dispatch team will contact you within <strong>1 hour</strong> to confirm guard assignment and finalize details.
              </p>
            </div>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">This is an estimated quote. Final billing will be based on actual service hours and any additional requirements.</p>
          </div>
          <div style="background: #1a1a2e; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
            Sheriff Security Services — Professional Protection You Can Trust<br>
            <a href="${SITE_URL}" style="color: #60a5fa;">sheriffsecurity.com</a>
          </div>
        </div>
      `,
        });

        // ──────────────────────────────────────────────
        // EMAIL 2: Owner / Dispatch Notification
        // ──────────────────────────────────────────────
        await getResend().emails.send({
            from: "Sheriff AI System <onboarding@resend.dev>",
            to: OWNER_EMAIL,
            subject: `🚨 NEW REQUEST ${body.requestNumber} — ${body.serviceType.toUpperCase()} — ${body.location}`,
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #dc2626; border-radius: 12px; overflow: hidden;">
          <div style="background: #dc2626; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">🚨 New Service Request via AI Voice Agent</h1>
          </div>
          <div style="padding: 24px;">
            <h2 style="margin-top: 0; color: #1f2937;">${body.requestNumber}</h2>

            <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">👤 Customer</h3>
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr><td style="padding: 4px 0;"><strong>Name:</strong></td><td>${body.customerName}</td></tr>
              <tr><td style="padding: 4px 0;"><strong>Email:</strong></td><td><a href="mailto:${body.customerEmail}">${body.customerEmail}</a></td></tr>
              <tr><td style="padding: 4px 0;"><strong>Phone:</strong></td><td>${body.customerPhone || "Not provided"}</td></tr>
              ${body.companyName ? `<tr><td style="padding: 4px 0;"><strong>Company:</strong></td><td>${body.companyName}</td></tr>` : ""}
            </table>

            <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 20px;">📋 Service Details</h3>
            <pre style="white-space: pre-wrap; background: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6;">${serviceDetails}</pre>

            <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #991b1b; font-weight: bold;">⚡ Action Required: Contact customer within 1 hour</p>
            </div>

            <a href="${SITE_URL}/dashboard/leads"
               style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: bold;">
              View in Dashboard →
            </a>
          </div>
        </div>
      `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Invoice email error:", error);
        return NextResponse.json(
            { error: "Failed to send confirmation emails" },
            { status: 500 }
        );
    }
}
