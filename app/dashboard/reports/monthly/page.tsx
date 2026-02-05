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
import { ArrowLeft, Calendar, TrendingUp, Users, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { MonthlySummaryExportButton } from "./monthly-summary-export-button";

export default async function MonthlySummaryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Get current month dates
  const now = new Date();
  const currentMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const currentMonthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

  // Build base queries with branch filter
  const branchFilter = profile.role === "branch_admin" && profile.branch_id
    ? { branch_id: profile.branch_id }
    : {};

  // Get active guards count
  let guardsQuery = supabase
    .from("guards")
    .select("id", { count: "exact" })
    .eq("status", "active");
  
  if (branchFilter.branch_id) {
    guardsQuery = guardsQuery.eq("branch_id", branchFilter.branch_id);
  }
  const { count: totalGuards } = await guardsQuery;

  // Get active places count
  let placesQuery = supabase
    .from("places")
    .select("id", { count: "exact" })
    .eq("status", "active");
  
  if (branchFilter.branch_id) {
    placesQuery = placesQuery.eq("branch_id", branchFilter.branch_id);
  }
  const { count: totalPlaces } = await placesQuery;

  // Get active assignments count
  let assignmentsQuery = supabase
    .from("assignments")
    .select("id", { count: "exact" })
    .eq("status", "active");
  
  if (branchFilter.branch_id) {
    assignmentsQuery = assignmentsQuery.eq("branch_id", branchFilter.branch_id);
  }
  const { count: activeAssignments } = await assignmentsQuery;

  // Get current month attendance stats
  let attendanceQuery = supabase
    .from("attendance")
    .select("status")
    .gte("date", currentMonthStart)
    .lte("date", currentMonthEnd);
  
  if (branchFilter.branch_id) {
    attendanceQuery = attendanceQuery.eq("branch_id", branchFilter.branch_id);
  }
  const { data: currentMonthAttendance } = await attendanceQuery;

  const presentCount = currentMonthAttendance?.filter((a) => a.status === "present").length || 0;
  const absentCount = currentMonthAttendance?.filter((a) => a.status === "absent").length || 0;
  const lateCount = currentMonthAttendance?.filter((a) => a.status === "late").length || 0;
  const totalRecords = currentMonthAttendance?.length || 0;
  const attendanceRate = totalRecords > 0 
    ? Math.round(((presentCount + lateCount) / totalRecords) * 100) 
    : 0;

  // Get current month revenue
  let invoicesQuery = supabase
    .from("invoices")
    .select("total, status")
    .gte("invoice_date", currentMonthStart)
    .lte("invoice_date", currentMonthEnd);
  
  if (branchFilter.branch_id) {
    invoicesQuery = invoicesQuery.eq("branch_id", branchFilter.branch_id);
  }
  const { data: currentMonthInvoices } = await invoicesQuery;

  const totalBilled = currentMonthInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
  const paidAmount = currentMonthInvoices
    ?.filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

  // For export button data
  const monthName = format(now, "MMMM");
  const yearNum = now.getFullYear();

  // Get pending invoices count
  let pendingInvoicesQuery = supabase
    .from("invoices")
    .select("id", { count: "exact" })
    .in("status", ["draft", "sent", "unpaid"] as const)
    .gte("invoice_date", currentMonthStart)
    .lte("invoice_date", currentMonthEnd);
  
  if (branchFilter.branch_id) {
    pendingInvoicesQuery = pendingInvoicesQuery.eq("branch_id", branchFilter.branch_id);
  }
  const { count: pendingInvoices } = await pendingInvoicesQuery;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Export stats data
  const exportStats = {
    totalGuards: totalGuards || 0,
    activeAssignments: activeAssignments || 0,
    totalAttendance: totalRecords,
    presentDays: presentCount + lateCount,
    absentDays: absentCount,
    attendanceRate: attendanceRate,
    totalRevenue: totalBilled,
    pendingInvoices: pendingInvoices || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monthly Summary</h1>
            <p className="text-muted-foreground">
              Overview for {format(now, "MMMM yyyy")}
            </p>
          </div>
        </div>
        <MonthlySummaryExportButton
          month={monthName}
          year={yearNum}
          stats={exportStats}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Guards</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuards || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently active in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Places</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlaces || 0}</div>
            <p className="text-xs text-muted-foreground">
              Client locations served
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {presentCount + lateCount} of {totalRecords} records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(paidAmount)} collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
          <CardDescription>
            Attendance breakdown for {format(now, "MMMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-green-600">Present</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{lateCount}</div>
              <div className="text-sm text-yellow-600">Late</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-red-600">Absent</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{totalRecords}</div>
              <div className="text-sm text-blue-600">Total Records</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
          <CardDescription>Summary of operational metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Active Assignments</TableCell>
                <TableCell className="text-right">{activeAssignments || 0}</TableCell>
                <TableCell>
                  <Badge variant="default">Active</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Attendance Rate</TableCell>
                <TableCell className="text-right">{attendanceRate}%</TableCell>
                <TableCell>
                  <Badge variant={attendanceRate >= 90 ? "default" : attendanceRate >= 75 ? "secondary" : "destructive"}>
                    {attendanceRate >= 90 ? "Excellent" : attendanceRate >= 75 ? "Good" : "Needs Attention"}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Collection Rate</TableCell>
                <TableCell className="text-right">
                  {totalBilled > 0 ? Math.round((paidAmount / totalBilled) * 100) : 0}%
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {formatCurrency(paidAmount)} / {formatCurrency(totalBilled)}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Guard Utilization</TableCell>
                <TableCell className="text-right">
                  {totalGuards && totalGuards > 0 ? Math.round(((activeAssignments || 0) / totalGuards) * 100) : 0}%
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {activeAssignments || 0} assigned / {totalGuards || 0} total
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
