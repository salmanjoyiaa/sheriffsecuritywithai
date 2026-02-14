import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Users,
  ClipboardCheck,
  Package,
  FileText,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  status: string;
  shift: string;
  guard: { full_name: string | null; guard_code: string } | null;
  place: { name: string } | null;
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  total_amount: number | null;
  status: string;
  place: { name: string } | null;
}

async function DashboardStats() {
  const supabase = await createClient();

  // Get user profile to determine role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user?.id || "")
    .single();

  const isSuperAdmin = profile?.role === "super_admin";

  // Fetch counts
  const [
    { count: branchCount },
    { count: placeCount },
    { count: guardCount },
    { count: activeAssignments },
    { count: todayAttendance },
    { count: pendingInvoices },
  ] = await Promise.all([
    supabase.from("branches").select("*", { count: "exact", head: true }),
    supabase.from("places").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("guards").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split("T")[0]}`),
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", new Date().toISOString().split("T")[0]),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("status", "unpaid"),
  ]);

  const stats = [
    ...(isSuperAdmin
      ? [
          {
            name: "Total Branches",
            value: branchCount || 0,
            icon: Building2,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
        ]
      : []),
    {
      name: "Active Places",
      value: placeCount || 0,
      icon: MapPin,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      name: "Active Guards",
      value: guardCount || 0,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      name: "Active Assignments",
      value: activeAssignments || 0,
      icon: Calendar,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      name: "Today's Attendance",
      value: todayAttendance || 0,
      icon: ClipboardCheck,
      color: "text-teal-600",
      bg: "bg-teal-100",
    },
    {
      name: "Pending Invoices",
      value: pendingInvoices || 0,
      icon: FileText,
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.name}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function RecentActivity() {
  const supabase = await createClient();

  // Get recent attendance
  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("*, guard:guards(full_name, guard_code), place:places(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {recentAttendance && recentAttendance.length > 0 ? (
          <div className="space-y-4">
            {recentAttendance.map((record: AttendanceRecord) => (
              <div
                key={record.id}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">
                    {record.guard?.full_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.place?.name || "Unknown"} • {record.shift} shift
                  </p>
                </div>
                <Badge
                  variant={
                    record.status === "present"
                      ? "success"
                      : record.status === "absent"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {record.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent attendance records</p>
        )}
      </CardContent>
    </Card>
  );
}

async function RecentInvoices() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, place:places(name)")
    .order("invoice_date", { ascending: false })
    .limit(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices && invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map((invoice: InvoiceRecord) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{invoice.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.place?.name || "Unknown"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    Rs. {(invoice.total_amount || 0).toLocaleString()}
                  </p>
                  <Badge 
                    variant={invoice.status === "paid" ? "success" : "destructive"} 
                    className="text-xs"
                  >
                    {invoice.status === "paid" ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No invoices found</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, branch:branches(name)")
    .eq("id", user?.id || "")
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name?.split(" ")[0] || "User"}!
        </h1>
        <p className="text-muted-foreground">
          {profile?.role === "super_admin"
            ? "Here's an overview of all branches"
            : `Managing ${profile?.branch?.name || "your branch"}`}
        </p>
      </div>

      {/* Stats */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <DashboardStats />
      </Suspense>

      {/* Activity Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={
          <Card>
            <CardHeader><div className="h-5 w-40 bg-gray-200 rounded animate-pulse" /></CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        }>
          <RecentActivity />
        </Suspense>
        <Suspense fallback={
          <Card>
            <CardHeader><div className="h-5 w-40 bg-gray-200 rounded animate-pulse" /></CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="space-y-1">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        }>
          <RecentInvoices />
        </Suspense>
      </div>
    </div>
  );
}
