"use server";

import { createClient } from "@/lib/supabase/server";
import { reportsSchema } from "@/lib/validations";

export interface AttendanceReportData {
  guard: {
    id: string;
    name: string;
    guard_code: string;
    photo_url: string | null;
  };
  place: {
    id: string;
    name: string;
    city: string;
  };
  attendance: {
    date: string;
    shift: string;
    status: string;
    check_in_time: string | null;
    check_out_time: string | null;
  }[];
  summary: {
    present: number;
    absent: number;
    late: number;
    half_day: number;
    leave: number;
    total_days: number;
    attendance_rate: number;
  };
  inventory: {
    id: string;
    item_name: string;
    serial_number: string | null;
    quantity: number;
    assigned_at: string;
  }[];
}

export interface PlaceReportData {
  place: {
    id: string;
    name: string;
    address: string;
    city: string;
    contact_person: string | null;
    contact_phone: string | null;
  };
  guards: {
    id: string;
    name: string;
    guard_code: string;
    shift: string;
    start_date: string;
    end_date: string | null;
  }[];
  attendance_summary: {
    total_records: number;
    total_days: number;
    present: number;
    absent: number;
    late: number;
    half_day: number;
    leave: number;
    attendance_rate: number;
  };
  inventory: {
    id: string;
    item_name: string;
    serial_number: string | null;
    quantity: number;
    assigned_at: string;
    assigned_to_guard: string | null;
  }[];
  period: {
    start: string;
    end: string;
  };
}

export async function generateAttendanceReport(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const rawData = {
    report_type: formData.get("report_type") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    guard_id: formData.get("guard_id") as string || undefined,
    place_id: formData.get("place_id") as string || undefined,
    branch_id: formData.get("branch_id") as string || undefined,
  };

  const validatedData = reportsSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  // Get attendance records with related data
  let query = supabase
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
    .gte("date", validatedData.data.start_date)
    .lte("date", validatedData.data.end_date)
    .order("date");

  const { data: attendance, error } = await query;

  if (error) {
    console.error("Error fetching attendance:", error);
    return { error: error.message };
  }

  // Filter by guard if specified
  let filteredAttendance = attendance || [];
  if (validatedData.data.guard_id) {
    filteredAttendance = filteredAttendance.filter(
      (a) => ((a as unknown as { assignment: { guard: { id: string } } }).assignment)?.guard?.id === validatedData.data.guard_id
    );
  }

  // Filter by place if specified
  if (validatedData.data.place_id) {
    filteredAttendance = filteredAttendance.filter(
      (a) => ((a as unknown as { assignment: { place: { id: string } } }).assignment)?.place?.id === validatedData.data.place_id
    );
  }

  // Group by guard
  const guardMap = new Map<string, AttendanceReportData>();

  filteredAttendance.forEach((record) => {
    const assignment = (record as unknown as {
      assignment: {
        guard: { id: string; name: string; guard_code: string; photo_url: string | null };
        place: { id: string; name: string; city: string };
      };
    }).assignment;

    if (!assignment?.guard) return;

    const guardId = assignment.guard.id;
    
    if (!guardMap.has(guardId)) {
      guardMap.set(guardId, {
        guard: assignment.guard,
        place: assignment.place,
        attendance: [],
        summary: {
          present: 0,
          absent: 0,
          late: 0,
          half_day: 0,
          leave: 0,
          total_days: 0,
          attendance_rate: 0,
        },
        inventory: [],
      });
    }

    const guardData = guardMap.get(guardId)!;
    guardData.attendance.push({
      date: record.date,
      shift: record.shift,
      status: record.status,
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
    });

    // Update summary
    guardData.summary.total_days++;
    switch (record.status) {
      case "present":
        guardData.summary.present++;
        break;
      case "absent":
        guardData.summary.absent++;
        break;
      case "late":
        guardData.summary.late++;
        break;
      case "half_day":
        guardData.summary.half_day++;
        break;
      case "leave":
        guardData.summary.leave++;
        break;
    }
  });

  // Calculate attendance rates
  guardMap.forEach((data) => {
    const workDays = data.summary.present + data.summary.late + data.summary.half_day * 0.5;
    data.summary.attendance_rate = data.summary.total_days > 0
      ? Math.round((workDays / data.summary.total_days) * 100)
      : 0;
  });

  // Fetch inventory assignments for each guard
  const guardIds = Array.from(guardMap.keys());
  if (guardIds.length > 0) {
    const { data: inventoryAssignments, error: invError } = await supabase
      .from("inventory_assignments")
      .select(`
        id,
        quantity,
        assigned_at,
        guard_id,
        item_id,
        item:inventory_items!item_id(name),
        unit:inventory_units(serial_number)
      `)
      .in("guard_id", guardIds)
      .is("returned_at", null);

    // Add inventory to each guard
    inventoryAssignments?.forEach((assignment) => {
      if (!assignment.guard_id) return;
      const guardData = guardMap.get(assignment.guard_id);
      if (guardData) {
        guardData.inventory.push({
          id: assignment.id,
          item_name: (assignment.item as { name: string })?.name || "Unknown",
          serial_number: (assignment.unit as { serial_number: string })?.serial_number || null,
          quantity: assignment.quantity,
          assigned_at: assignment.assigned_at,
        });
      }
    });
  }

  return {
    data: Array.from(guardMap.values()),
    period: {
      start: validatedData.data.start_date,
      end: validatedData.data.end_date,
    },
  };
}

export async function generatePlaceReport(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const placeId = formData.get("place_id") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;

  if (!placeId || !startDate || !endDate) {
    return { error: "Missing required fields" };
  }

  // Get place details
  const { data: place, error: placeError } = await supabase
    .from("places")
    .select("*")
    .eq("id", placeId)
    .single();

  if (placeError || !place) {
    return { error: "Place not found" };
  }

  // Get assignments for this place
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select(`
      id,
      shift_type,
      start_date,
      end_date,
      guard:guards(id, name, guard_code)
    `)
    .eq("place_id", placeId)
    .eq("status", "active");

  // Get attendance for this place in the period
  const { data: attendance } = await supabase
    .from("attendance")
    .select("status")
    .eq("place_id", placeId)
    .gte("date", startDate)
    .lte("date", endDate);

  // Calculate attendance summary
  const summary = {
    total_records: attendance?.length || 0,
    total_days: attendance?.length || 0,
    present: attendance?.filter((a) => a.status === "present").length || 0,
    absent: attendance?.filter((a) => a.status === "absent").length || 0,
    late: attendance?.filter((a) => a.status === "late").length || 0,
    half_day: attendance?.filter((a) => a.status === "half_day").length || 0,
    leave: attendance?.filter((a) => a.status === "leave").length || 0,
    attendance_rate: 0,
  };

  if (summary.total_records > 0) {
    const workDays = summary.present + summary.late;
    summary.attendance_rate = Math.round((workDays / summary.total_records) * 100);
  }

  // Fetch inventory assigned to this place
  const { data: inventoryAssignments, error: invError } = await supabase
    .from("inventory_assignments")
    .select(`
      id,
      quantity,
      assigned_at,
      item_id,
      item:inventory_items!item_id(name),
      unit:inventory_units(serial_number),
      guard:guards(name)
    `)
    .eq("place_id", placeId)
    .is("returned_at", null);

  const reportData: PlaceReportData = {
    place: {
      id: place.id,
      name: place.name,
      address: place.address,
      city: place.city,
      contact_person: place.contact_person,
      contact_phone: place.contact_phone,
    },
    guards: assignments?.map((a) => ({
      id: (a.guard as { id: string })?.id || "",
      name: (a.guard as { name: string })?.name || "Unknown",
      guard_code: (a.guard as { guard_code: string })?.guard_code || "",
      shift: a.shift_type,
      start_date: a.start_date,
      end_date: a.end_date,
    })).filter(g => g.id) || [],
    attendance_summary: summary,
    inventory: inventoryAssignments?.map((a) => ({
      id: a.id,
      item_name: (a.item as { name: string })?.name || "Unknown",
      serial_number: (a.unit as { serial_number: string })?.serial_number || null,
      quantity: a.quantity,
      assigned_at: a.assigned_at,
      assigned_to_guard: (a.guard as { name: string })?.name || null,
    })) || [],
    period: {
      start: startDate,
      end: endDate,
    },
  };

  return { data: reportData };
}
