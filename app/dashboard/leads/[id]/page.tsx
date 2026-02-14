import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Clock,
    Shield,
    DollarSign,
    FileText,
    Building2,
    MessageSquare,
} from "lucide-react";
import { LeadStatusUpdater } from "./lead-status-updater";

interface ServiceRequestDetail {
    id: string;
    request_number: string;
    branch_id: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    company_name: string | null;
    service_type: string;
    location_address: string;
    location_city: string | null;
    location_state: string | null;
    num_guards: number;
    duration_hours: number | null;
    start_date: string | null;
    start_time: string | null;
    special_requirements: string[] | null;
    additional_notes: string | null;
    package_id: string | null;
    hourly_rate: number | null;
    estimated_total: number | null;
    currency: string;
    status: string;
    priority: string;
    source: string;
    ai_transcript: string | null;
    created_at: string;
    updated_at: string | null;
    confirmed_at: string | null;
    invoice_sent_to_customer: boolean;
    invoice_sent_at: string | null;
    branch: { name: string } | null;
}

const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    confirmed: "bg-yellow-100 text-yellow-800",
    assigned: "bg-purple-100 text-purple-800",
    active: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
};

export default async function LeadDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: lead, error } = await supabase
        .from("service_requests")
        .select("*, branch:branches(name)")
        .eq("id", id)
        .single();

    if (error || !lead) {
        notFound();
    }

    const sr = lead as unknown as ServiceRequestDetail;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/leads">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Leads
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {sr.request_number}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Created {new Date(sr.created_at).toLocaleString()} via{" "}
                        <Badge variant="outline" className="text-xs">
                            {sr.source.replace("_", " ")}
                        </Badge>
                    </p>
                </div>
                <Badge
                    className={`text-sm px-3 py-1 ${statusColors[sr.status] || statusColors.new} capitalize`}
                >
                    {sr.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — Main info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Full Name</p>
                                    <p className="font-medium">{sr.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> Email
                                    </p>
                                    <a
                                        href={`mailto:${sr.customer_email}`}
                                        className="font-medium text-blue-600 hover:underline"
                                    >
                                        {sr.customer_email}
                                    </a>
                                </div>
                                {sr.customer_phone && (
                                    <div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> Phone
                                        </p>
                                        <a
                                            href={`tel:${sr.customer_phone}`}
                                            className="font-medium"
                                        >
                                            {sr.customer_phone}
                                        </a>
                                    </div>
                                )}
                                {sr.company_name && (
                                    <div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Building2 className="h-3 w-3" /> Company
                                        </p>
                                        <p className="font-medium">{sr.company_name}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Service Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Service Type</p>
                                    <Badge variant="outline" className="capitalize mt-1">
                                        {sr.service_type}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> Location
                                    </p>
                                    <p className="font-medium">{sr.location_address}</p>
                                    {sr.location_city && (
                                        <p className="text-sm text-muted-foreground">
                                            {sr.location_city}
                                            {sr.location_state ? `, ${sr.location_state}` : ""}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Guards Requested</p>
                                    <p className="font-medium text-xl">{sr.num_guards}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Duration
                                    </p>
                                    <p className="font-medium">
                                        {sr.duration_hours ? `${sr.duration_hours} hours` : "—"}
                                    </p>
                                </div>
                                {sr.start_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Start Date
                                        </p>
                                        <p className="font-medium">
                                            {new Date(sr.start_date).toLocaleDateString()}
                                            {sr.start_time ? ` at ${sr.start_time}` : ""}
                                        </p>
                                    </div>
                                )}
                                {sr.special_requirements && sr.special_requirements.length > 0 && (
                                    <div className="sm:col-span-2">
                                        <p className="text-sm text-muted-foreground">
                                            Special Requirements
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {sr.special_requirements.map((req, i) => (
                                                <Badge key={i} variant="secondary">
                                                    {req}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {sr.additional_notes && (
                                    <div className="sm:col-span-2">
                                        <p className="text-sm text-muted-foreground">Notes</p>
                                        <p className="text-sm">{sr.additional_notes}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Transcript */}
                    {sr.ai_transcript && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    AI Conversation Transcript
                                </CardTitle>
                                <CardDescription>
                                    Full voice conversation between the customer and Officer Mike
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                                        {sr.ai_transcript}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right column — Pricing + Actions */}
                <div className="space-y-6">
                    {/* Pricing Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-primary" />
                                Pricing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Hourly Rate</span>
                                <span className="font-medium">
                                    {sr.hourly_rate
                                        ? `${sr.currency} ${Number(sr.hourly_rate).toLocaleString()}/hr`
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Guards</span>
                                <span className="font-medium">{sr.num_guards}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Duration</span>
                                <span className="font-medium">
                                    {sr.duration_hours ? `${sr.duration_hours}h` : "—"}
                                </span>
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                                <span className="font-bold">Estimated Total</span>
                                <span className="font-bold text-lg text-primary">
                                    {sr.estimated_total
                                        ? `${sr.currency} ${Number(sr.estimated_total).toLocaleString()}`
                                        : "—"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Updater */}
                    <LeadStatusUpdater id={sr.id} currentStatus={sr.status} />

                    {/* Invoice Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Invoice
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`w-2 h-2 rounded-full ${sr.invoice_sent_to_customer ? "bg-green-500" : "bg-gray-300"}`}
                                    />
                                    <span className="text-sm">
                                        {sr.invoice_sent_to_customer
                                            ? `Sent to customer ${sr.invoice_sent_at ? `on ${new Date(sr.invoice_sent_at).toLocaleDateString()}` : ""}`
                                            : "Not yet sent"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Branch */}
                    {sr.branch && (
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Assigned Branch
                                </p>
                                <p className="font-medium flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    {sr.branch.name}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
