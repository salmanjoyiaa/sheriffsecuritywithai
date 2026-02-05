"use server";

import { createClient } from "@/lib/supabase/server";
import { assignmentSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAssignment(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  // Get branch_id first - from guard (for super_admin) or use user's branch_id
  let branchId = profile.branch_id;
  const guardId = formData.get("guard_id") as string;
  
  if (profile.role === "super_admin" && guardId) {
    const { data: guard } = await supabase
      .from("guards")
      .select("branch_id")
      .eq("id", guardId)
      .single();
    if (guard) {
      branchId = guard.branch_id;
    }
  }

  if (!branchId) {
    return { error: "Could not determine branch" };
  }

  const rawData = {
    branch_id: branchId,
    guard_id: guardId,
    place_id: formData.get("place_id") as string,
    shift_type: formData.get("shift_type") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string || undefined,
    notes: formData.get("notes") as string || undefined,
  };

  const validatedData = assignmentSchema.safeParse(rawData);
  if (!validatedData.success) {
    console.error("Assignment validation error:", validatedData.error.errors);
    return { error: validatedData.error.errors[0].message };
  }

  // Check for overlapping assignments using the database function
  const startDateStr = validatedData.data.start_date instanceof Date 
    ? validatedData.data.start_date.toISOString().split('T')[0] 
    : validatedData.data.start_date;
  const endDateStr = validatedData.data.end_date 
    ? (validatedData.data.end_date instanceof Date 
        ? validatedData.data.end_date.toISOString().split('T')[0] 
        : validatedData.data.end_date)
    : null;
  
  const { data: overlapCheck, error: overlapError } = await supabase
    .rpc("check_assignment_overlap", {
      p_guard_id: validatedData.data.guard_id,
      p_start_date: startDateStr,
      p_end_date: endDateStr,
      p_exclude_id: null,
    });

  if (overlapError) {
    console.error("Error checking overlap:", overlapError);
  } else if (overlapCheck) {
    return { error: "This assignment overlaps with an existing assignment for this guard" };
  }

  const { error } = await supabase.from("assignments").insert({
    branch_id: branchId,
    guard_id: validatedData.data.guard_id,
    place_id: validatedData.data.place_id,
    shift_type: validatedData.data.shift_type,
    start_date: validatedData.data.start_date instanceof Date 
      ? validatedData.data.start_date.toISOString().split('T')[0] 
      : validatedData.data.start_date,
    end_date: validatedData.data.end_date 
      ? (validatedData.data.end_date instanceof Date 
          ? validatedData.data.end_date.toISOString().split('T')[0] 
          : validatedData.data.end_date)
      : null,
    status: 'active',
    notes: validatedData.data.notes || null,
  });

  if (error) {
    console.error("Error creating assignment:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/assignments");
  redirect("/dashboard/assignments");
}

export async function updateAssignment(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the existing assignment to use its branch_id
  const { data: existingAssignment } = await supabase
    .from("assignments")
    .select("branch_id")
    .eq("id", id)
    .single();

  if (!existingAssignment) {
    return { error: "Assignment not found" };
  }

  const rawData = {
    branch_id: existingAssignment.branch_id,
    guard_id: formData.get("guard_id") as string,
    place_id: formData.get("place_id") as string,
    shift_type: formData.get("shift_type") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string || undefined,
    notes: formData.get("notes") as string || undefined,
  };

  // Get status separately since it's not in the validation schema
  const status = formData.get("status") as string || "active";

  const validatedData = assignmentSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  // Check for overlapping assignments (excluding current assignment)
  const startDateStr = validatedData.data.start_date instanceof Date 
    ? validatedData.data.start_date.toISOString().split('T')[0] 
    : validatedData.data.start_date;
  const endDateStr = validatedData.data.end_date 
    ? (validatedData.data.end_date instanceof Date 
        ? validatedData.data.end_date.toISOString().split('T')[0] 
        : validatedData.data.end_date)
    : null;
  
  const { data: overlapCheck, error: overlapError } = await supabase
    .rpc("check_assignment_overlap", {
      p_guard_id: validatedData.data.guard_id,
      p_start_date: startDateStr,
      p_end_date: endDateStr,
      p_exclude_id: id,
    });

  if (overlapError) {
    console.error("Error checking overlap:", overlapError);
  } else if (overlapCheck) {
    return { error: "This assignment overlaps with an existing assignment for this guard" };
  }

  const { error } = await supabase
    .from("assignments")
    .update({
      guard_id: validatedData.data.guard_id,
      place_id: validatedData.data.place_id,
      shift_type: validatedData.data.shift_type,
      start_date: startDateStr,
      end_date: endDateStr,
      status: status as "active" | "completed" | "cancelled",
      notes: validatedData.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating assignment:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/assignments");
  redirect("/dashboard/assignments");
}

export async function deleteAssignment(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check for attendance records
  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("id")
    .eq("assignment_id", id)
    .limit(1);

  if (attendanceRecords && attendanceRecords.length > 0) {
    return { error: "Cannot delete assignment with attendance records. Consider marking it as completed instead." };
  }

  const { error } = await supabase.from("assignments").delete().eq("id", id);

  if (error) {
    console.error("Error deleting assignment:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/assignments");
  redirect("/dashboard/assignments");
}

export async function endAssignment(id: string, endDate: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("assignments")
    .update({
      end_date: endDate,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error ending assignment:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/assignments");
  return { success: true };
}
