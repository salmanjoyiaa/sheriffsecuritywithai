"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { getAssignmentsForAttendance, markBulkAttendance } from "../actions";

interface Place {
  id: string;
  name: string;
  city: string;
}

interface Guard {
  id: string;
  name: string;
  guard_code: string;
  photo_url: string | null;
}

interface AssignmentWithAttendance {
  id: string;
  shift_type: "day" | "night" | "both";
  start_date: string;
  end_date: string | null;
  guard: Guard | null;
  attendance: { status: string; notes: string | null } | null;
}

interface MarkAttendanceClientProps {
  places: Place[];
  initialDate: string;
}

export default function MarkAttendanceClient({
  places,
  initialDate,
}: MarkAttendanceClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [date, setDate] = useState(initialDate);
  const [shift, setShift] = useState<string>("");
  const [placeId, setPlaceId] = useState<string>("");
  const [assignments, setAssignments] = useState<AssignmentWithAttendance[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string; notes: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load assignments when date, shift, and place are selected
  useEffect(() => {
    if (date && shift && placeId) {
      loadAssignments();
    }
  }, [date, shift, placeId]);

  async function loadAssignments() {
    setIsLoading(true);
    const result = await getAssignmentsForAttendance(placeId, date, shift);
    setIsLoading(false);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setAssignments(result.assignments);
    
    // Initialize attendance data with existing records or default to empty
    const initialData: Record<string, { status: string; notes: string }> = {};
    result.assignments.forEach((a: AssignmentWithAttendance) => {
      initialData[a.id] = {
        status: a.attendance?.status || "",
        notes: a.attendance?.notes || "",
      };
    });
    setAttendanceData(initialData);
  }

  function updateAttendance(assignmentId: string, field: "status" | "notes", value: string) {
    setAttendanceData((prev) => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        [field]: value,
      },
    }));
  }

  function markAllAs(status: string) {
    const updated: Record<string, { status: string; notes: string }> = {};
    assignments.forEach((a) => {
      updated[a.id] = {
        ...attendanceData[a.id],
        status,
      };
    });
    setAttendanceData(updated);
  }

  async function handleSave() {
    // Filter out assignments without status
    const dataToSave = Object.entries(attendanceData)
      .filter(([_, data]) => data.status)
      .map(([assignment_id, data]) => ({
        assignment_id,
        status: data.status,
        notes: data.notes || undefined,
      }));

    if (dataToSave.length === 0) {
      toast({
        title: "No data to save",
        description: "Please mark at least one guard's attendance",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const result = await markBulkAttendance(date, shift, placeId, dataToSave);
    setIsSaving(false);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Marked attendance for ${result.count} guards`,
      });
      router.push("/dashboard/attendance");
    }
  }

  const statusOptions = [
    { value: "present", label: "Present", color: "bg-green-500" },
    { value: "absent", label: "Absent", color: "bg-red-500" },
    { value: "late", label: "Late", color: "bg-yellow-500" },
    { value: "half_day", label: "Half Day", color: "bg-orange-500" },
    { value: "leave", label: "Leave", color: "bg-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/attendance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-muted-foreground">
            Select date, shift, and place to mark attendance
          </p>
        </div>
      </div>

      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Criteria</CardTitle>
          <CardDescription>
            Choose the date, shift, and location to load assigned guards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day Shift (8AM - 8PM)</SelectItem>
                  <SelectItem value="night">Night Shift (8PM - 8AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="place">Place</Label>
              <Select value={placeId} onValueChange={setPlaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select place" />
                </SelectTrigger>
                <SelectContent>
                  {places.map((place) => (
                    <SelectItem key={place.id} value={place.id}>
                      {place.name} - {place.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      {date && shift && placeId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Guards on Duty</CardTitle>
                <CardDescription>
                  {format(new Date(date), "PPPP")} - {shift === "day" ? "Day" : "Night"} Shift
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAs("present")}
                  disabled={assignments.length === 0}
                >
                  <Check className="mr-1 h-4 w-4 text-green-600" />
                  All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAs("absent")}
                  disabled={assignments.length === 0}
                >
                  <X className="mr-1 h-4 w-4 text-red-600" />
                  All Absent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={assignment.guard?.photo_url || undefined}
                        alt={assignment.guard?.name}
                      />
                      <AvatarFallback>
                        {assignment.guard?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{assignment.guard?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.guard?.guard_code}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusOptions.map((status) => (
                        <Button
                          key={status.value}
                          variant={
                            attendanceData[assignment.id]?.status === status.value
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className={
                            attendanceData[assignment.id]?.status === status.value
                              ? status.color
                              : ""
                          }
                          onClick={() =>
                            updateAttendance(assignment.id, "status", status.value)
                          }
                        >
                          {status.label}
                        </Button>
                      ))}
                    </div>
                    <div className="w-48">
                      <Input
                        placeholder="Notes (optional)"
                        value={attendanceData[assignment.id]?.notes || ""}
                        onChange={(e) =>
                          updateAttendance(assignment.id, "notes", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/attendance">Cancel</Link>
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Attendance
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  No guards assigned to this place for the selected shift.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/dashboard/assignments/new">Create Assignment</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
