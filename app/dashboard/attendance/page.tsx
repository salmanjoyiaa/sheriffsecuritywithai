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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, CheckCircle, Clock, Plus, XCircle } from "lucide-react";
import { format, subDays } from "date-fns";

export default async function AttendancePage() {
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

  // Get recent attendance records (last 7 days)
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
  
  const { data: attendance, error } = await supabase
    .from("attendance")
    .select(`
      *,
      assignment:assignments(
        id,
        shift_type,
        guard:guards(id, name, guard_code, photo_url, branch_id),
        place:places(id, name, city, branch_id)
      )
    `)
    .gte("date", sevenDaysAgo)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching attendance:", error);
  }

  // Filter by branch for branch_admin
  let filteredAttendance = attendance || [];
  if (profile.role === "branch_admin" && profile.branch_id) {
    filteredAttendance = filteredAttendance.filter((a) => {
      const assignment = (a as unknown as {
        assignment: {
          guard: { branch_id: string } | null;
          place: { branch_id: string } | null;
        } | null;
      }).assignment;
      return (
        assignment?.guard?.branch_id === profile.branch_id ||
        assignment?.place?.branch_id === profile.branch_id
      );
    });
  }

  // Get stats for today
  const today = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = filteredAttendance.filter((a) => a.date === today);
  const presentToday = todayAttendance.filter((a) => a.status === "present").length;
  const absentToday = todayAttendance.filter((a) => a.status === "absent").length;
  const lateToday = todayAttendance.filter((a) => a.status === "late").length;

  const statusColors: Record<string, string> = {
    present: "default",
    absent: "destructive",
    late: "secondary",
    half_day: "outline",
    leave: "outline",
  };

  const shiftLabels: Record<string, string> = {
    day: "Day",
    night: "Night",
    "24h": "24H",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Track and manage guard attendance records
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/attendance/mark">
            <Plus className="mr-2 h-4 w-4" />
            Mark Attendance
          </Link>
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Records</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAttendance.length}</div>
            <p className="text-xs text-muted-foreground">{today}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lateToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>
            Attendance records from the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Guard</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map((record) => {
                  const assignment = (record as unknown as {
                    assignment: {
                      id: string;
                      shift_type: string;
                      guard: { id: string; name: string; guard_code: string; photo_url: string | null } | null;
                      place: { id: string; name: string; city: string } | null;
                    } | null;
                  }).assignment;

                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(record.date), "PP")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={assignment?.guard?.photo_url || undefined}
                              alt={assignment?.guard?.name}
                            />
                            <AvatarFallback className="text-xs">
                              {assignment?.guard?.name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {assignment?.guard?.name || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {assignment?.guard?.guard_code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {assignment?.place?.name || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {assignment?.place?.city}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {shiftLabels[record.shift] || record.shift}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[record.status] as "default" | "destructive" | "secondary" | "outline"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {record.check_in_time && (
                            <span className="text-green-600">
                              In: {record.check_in_time}
                            </span>
                          )}
                          {record.check_in_time && record.check_out_time && " | "}
                          {record.check_out_time && (
                            <span className="text-red-600">
                              Out: {record.check_out_time}
                            </span>
                          )}
                          {!record.check_in_time && !record.check_out_time && "—"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No attendance records</h3>
              <p className="text-muted-foreground mb-4">
                Start by marking attendance for today.
              </p>
              <Button asChild>
                <Link href="/dashboard/attendance/mark">
                  <Plus className="mr-2 h-4 w-4" />
                  Mark Attendance
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
