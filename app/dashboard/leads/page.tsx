import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    UserPlus,
    Eye,
    MapPin,
    Phone,
    Mail,
    DollarSign,
    Calendar,
    Shield,
} from "lucide-react";

const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    confirmed: "bg-yellow-100 text-yellow-800",
    assigned: "bg-purple-100 text-purple-800",
    active: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    normal: "bg-blue-50 text-blue-600",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
};

interface ServiceRequest {
    id: string;
    request_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    service_type: string;
    location_address: string;
    location_city: string | null;
    num_guards: number;
    duration_hours: number | null;
    estimated_total: number | null;
    status: string;
    priority: string;
    source: string;
    created_at: string;
    branch_id: string | null;
    branch: { name: string } | null;
}

export default async function LeadsPage() {
    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, branch_id")
        .eq("id", user.id)
        .single();

    if (!profile) {
        redirect("/login");
    }

    // Fetch service requests — scoped by branch for branch admins
    let query = supabase
        .from("service_requests")
        .select("*, branch:branches(name)")
        .order("created_at", { ascending: false });

    if (profile.role === "branch_admin" && profile.branch_id) {
        query = query.eq("branch_id", profile.branch_id);
    }

    const { data: serviceRequests } = await query;
    const leads = (serviceRequests as unknown as ServiceRequest[]) || [];

    // Stats
    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === "new").length;
    const totalRevenue = leads
        .filter((l) => l.status !== "cancelled")
        .reduce((sum, l) => sum + (l.estimated_total || 0), 0);

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserPlus className="h-6 w-6 text-primary" />
                        Leads & Service Requests
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        AI-generated leads from customers via the voice agent
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalLeads}</p>
                            <p className="text-sm text-muted-foreground">Total Leads</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-100">
                            <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{newLeads}</p>
                            <p className="text-sm text-muted-foreground">New (Action Required)</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-yellow-100">
                            <DollarSign className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                PKR {totalRevenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">Pipeline Value</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Leads Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Service Requests</CardTitle>
                    <CardDescription>
                        {leads.length === 0
                            ? "No leads yet. Leads will appear here when customers use the AI voice agent."
                            : `Showing ${leads.length} service request${leads.length === 1 ? "" : "s"}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {leads.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Request #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Guards</TableHead>
                                        <TableHead>Estimated Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-mono font-bold text-sm">
                                                {lead.request_number}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {lead.customer_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {lead.customer_email}
                                                    </p>
                                                    {lead.customer_phone && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {lead.customer_phone}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {lead.service_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                    <span className="max-w-[150px] truncate">
                                                        {lead.location_city || lead.location_address}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {lead.num_guards}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {lead.estimated_total
                                                    ? `PKR ${Number(lead.estimated_total).toLocaleString()}`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`${statusColors[lead.status] || statusColors.new} capitalize`}
                                                >
                                                    {lead.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/dashboard/leads/${lead.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Leads Yet</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                When customers interact with the AI voice agent on your website,
                                their service requests will appear here automatically.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
