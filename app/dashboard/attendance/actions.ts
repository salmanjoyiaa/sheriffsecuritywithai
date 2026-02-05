"use server";

import { createClient } from "@/lib/supabase/server";
import { attendanceSchema, bulkAttendanceSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function markAttendance(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const rawData = {
    assignment_id: formData.get("assignment_id") as string,
    date: formData.get("date") as string,
    shift: formData.get("shift") as string,
    status: formData.get("status") as string,
    check_in_time: formData.get("check_in_time") as string || undefined,
    check_out_time: formData.get("check_out_time") as string || undefined,
    notes: formData.get("notes") as string || undefined,
  };

  const validatedData = attendanceSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  if (!validatedData.data.assignment_id) {
    return { error: "Assignment ID is required" };
  }

  // Check for existing attendance record
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("assignment_id", validatedData.data.assignment_id)
    .eq("date", validatedData.data.date)
    .eq("shift", validatedData.data.shift)
    .single();

  // Fetch assignment to get guard_id, place_id, branch_id
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("guard_id, place_id, branch_id")
    .eq("id", validatedData.data.assignment_id)
    .single();

  if (assignmentError || !assignment) {
    return { error: "Assignment not found" };
  }

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from("attendance")
      .update({
        status: validatedData.data.status,
        check_in_time: validatedData.data.check_in_time || null,
        check_out_time: validatedData.data.check_out_time || null,
        notes: validatedData.data.notes || null,
        marked_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating attendance:", error);
      return { error: error.message };
    }
  } else {
    // Create new record
    const { error } = await supabase.from("attendance").insert({
      branch_id: assignment.branch_id,
      guard_id: assignment.guard_id,
      place_id: assignment.place_id,
      assignment_id: validatedData.data.assignment_id,
      date: validatedData.data.date,
      shift: validatedData.data.shift,
      status: validatedData.data.status,
      check_in_time: validatedData.data.check_in_time || null,
      check_out_time: validatedData.data.check_out_time || null,
      notes: validatedData.data.notes || null,
      marked_by: user.id,
    });

    if (error) {
      console.error("Error creating attendance:", error);
      return { error: error.message };
    }
  }

  revalidatePath("/dashboard/attendance");
  return { success: true };
}

export async function markBulkAttendance(
  date: string,
  shift: string,
  placeId: string,
  attendanceData: Array<{
    assignment_id: string;
    status: string;
    notes?: string;
  }>
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const validatedData = bulkAttendanceSchema.safeParse({
    date,
    shift,
    place_id: placeId,
    attendance: attendanceData,
  });

  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  // Get the place's branch_id first
  const { data: place, error: placeError } = await supabase
    .from("places")
    .select("branch_id")
    .eq("id", placeId)
    .single();

  if (placeError || !place) {
    return { error: "Place not found" };
  }

  // Process each attendance record
  const results = await Promise.all(
    attendanceData.map(async (record) => {
      // Get assignment details
      const { data: assignment } = await supabase
        .from("assignments")
        .select("guard_id")
        .eq("id", record.assignment_id)
        .single();

      if (!assignment) {
        return { assignment_id: record.assignment_id, error: { message: "Assignment not found" } };
      }

      // Check for existing attendance record
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("assignment_id", record.assignment_id)
        .eq("date", date)
        .eq("shift", shift as "day" | "night")
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("attendance")
          .update({
            status: record.status as "present" | "absent" | "leave" | "half_day" | "late",
            notes: record.notes || null,
            marked_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        return { assignment_id: record.assignment_id, error };
      } else {
        // Create new record
        const { error } = await supabase.from("attendance").insert({
          branch_id: place.branch_id,
          guard_id: assignment.guard_id,
          place_id: placeId,
          assignment_id: record.assignment_id,
          date,
          shift: shift as "day" | "night",
          status: record.status as "present" | "absent" | "leave" | "half_day" | "late",
          notes: record.notes || null,
          marked_by: user.id,
        });

        return { assignment_id: record.assignment_id, error };
      }
    })
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    console.error("Errors marking attendance:", errors);
    return { error: `Failed to mark ${errors.length} attendance records` };
  }

  revalidatePath("/dashboard/attendance");
  return { success: true, count: results.length };
}

export async function getAssignmentsForAttendance(
  placeId: string,
  date: string,
  shift: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", assignments: [] };
  }

  // Get active assignments for this place and shift that cover the date
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(`
      id,
      shift_type,
      start_date,
      end_date,
      guard:guards(id, name, guard_code, photo_url)
    `)
    .eq("place_id", placeId)
    .eq("status", "active")
    .or(`shift_type.eq.${shift},shift_type.eq.both`)
    .lte("start_date", date)
    .or(`end_date.is.null,end_date.gte.${date}`);

  if (error) {
    console.error("Error fetching assignments:", error);
    return { error: error.message, assignments: [] };
  }

  // Get existing attendance records for these assignments on this date/shift
  const assignmentIds = assignments?.map((a) => a.id) || [];
  
  let attendanceRecords: Record<string, { status: string; notes: string | null }> = {};
  
  if (assignmentIds.length > 0) {
    const { data: attendance } = await supabase
      .from("attendance")
      .select("assignment_id, status, notes")
      .in("assignment_id", assignmentIds)
      .eq("date", date)
      .eq("shift", shift as "day" | "night");

    if (attendance) {
      attendanceRecords = attendance.reduce((acc, a) => {
        if (a.assignment_id) {
          acc[a.assignment_id] = { status: a.status, notes: a.notes };
        }
        return acc;
      }, {} as Record<string, { status: string; notes: string | null }>);
    }
  }

  // Combine assignments with their attendance status
  const assignmentsWithAttendance = assignments?.map((a) => ({
    ...a,
    attendance: attendanceRecords[a.id] || null,
  })) || [];

  return { assignments: assignmentsWithAttendance };
}

export async function deleteAttendance(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.from("attendance").delete().eq("id", id);

  if (error) {
    console.error("Error deleting attendance:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/attendance");
  return { success: true };
}
