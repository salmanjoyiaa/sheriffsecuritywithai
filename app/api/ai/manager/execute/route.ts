import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

// Helper to resolve entity IDs from names (e.g., "Aslam" -> UUID)
async function resolveEntityId(
    supabase: SupabaseClient,
    table: "places" | "guards" | "inventory_items",
    name: string,
    branch_id: string
): Promise<string | null> {
    if (!name) return null;

    // First try exact match
    const { data: exact } = await supabase
        .from(table)
        .select("id")
        .eq("branch_id", branch_id)
        .ilike("name", name.trim())
        .limit(1)
        .single();

    if (exact) return exact.id;

    // Try partial match
    const { data: partial } = await supabase
        .from(table)
        .select("id")
        .eq("branch_id", branch_id)
        .ilike("name", `%${name.trim()}%`)
        .limit(1)
        .single();

    if (partial) return partial.id;

    return null;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Authenticate
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user profile for branch scoping
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, branch_id")
            .eq("id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const { actionType, entity, data } = await req.json();

        if (!actionType || !entity) {
            return NextResponse.json(
                { error: "actionType and entity are required" },
                { status: 400 }
            );
        }

        const branchId = profile.branch_id;

        // Create operations require a branch_id
        if (actionType === "create" && !branchId) {
            return NextResponse.json(
                { error: "No branch assigned. Cannot create records without a branch." },
                { status: 400 }
            );
        }

        // Execute the action based on entity and type
        switch (entity) {
            case "place": {
                if (actionType === "create") {
                    const { error } = await supabase.from("places").insert({
                        name: data.name,
                        address: data.address || "",
                        city: data.city || null,
                        contact_person: data.contact_person || null,
                        contact_phone: data.contact_phone || null,
                        branch_id: branchId as string,
                    });
                    if (error) throw error;
                    return NextResponse.json({ success: true, message: `Place "${data.name}" created` });
                }
                if (actionType === "update" && data.name) {
                    // Resolve ID if not provided
                    let id = data.id;
                    if (!id) {
                        id = await resolveEntityId(supabase, "places", data.name as string, branchId as string);
                    }

                    if (!id) {
                        return NextResponse.json({ error: `Could not find place "${data.name}"` }, { status: 404 });
                    }

                    const { error } = await supabase
                        .from("places")
                        .update({
                            address: data.address,
                            city: data.city,
                            contact_person: data.contact_person,
                            contact_phone: data.contact_phone,
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", id);

                    if (error) throw error;
                    return NextResponse.json({ success: true, message: `Place "${data.name}" updated` });
                }
                if (actionType === "list") {
                    let query = supabase.from("places").select("id, name, address, city").order("name");
                    if (profile.role === "branch_admin" && branchId) {
                        query = query.eq("branch_id", branchId);
                    }
                    const { data: places, error } = await query.limit(20);
                    if (error) throw error;
                    return NextResponse.json({ success: true, data: places });
                }
                if (actionType === "delete" && data.id) {
                    const { error } = await supabase.from("places").delete().eq("id", data.id);
                    if (error) throw error;
                    return NextResponse.json({ success: true, message: "Place deleted" });
                }
                break;
            }

            case "guard": {
                if (actionType === "create") {
                    const { error } = await supabase.from("guards").insert({
                        name: data.name,
                        guard_code: data.guard_code,
                        cnic: data.cnic,
                        phone: data.phone || null,
                        address: data.address || null,
                        status: "active",
                        branch_id: branchId as string,
                    });
                    if (error) throw error;
                    return NextResponse.json({ success: true, message: `Guard "${data.name}" created` });
                }
                if (actionType === "update" && data.name) {
                    // Resolve ID if not provided
                    let id = data.id;
                    if (!id) {
                        id = await resolveEntityId(supabase, "guards", data.name as string, branchId as string);
                    }

                    if (!id) {
                        return NextResponse.json({ error: `Could not find guard "${data.name}"` }, { status: 404 });
                    }

                    const { error } = await supabase.from("guards")
                        .update({
                            phone: data.phone,
                            address: data.address,
                            status: data.status,
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", id);
                    if (error) throw error;
                    return NextResponse.json({ success: true, message: `Guard "${data.name}" updated` });
                }
                if (actionType === "list") {
                    let query = supabase.from("guards").select("id, name, guard_code, phone, status").order("name");
                    if (profile.role === "branch_admin" && branchId) {
                        query = query.eq("branch_id", branchId);
                    }
                    const { data: guards, error } = await query.limit(20);
                    if (error) throw error;
                    return NextResponse.json({ success: true, data: guards });
                }
                if (actionType === "delete" && data.id) {
                    const { error } = await supabase.from("guards").delete().eq("id", data.id);
                    if (error) throw error;
                    return NextResponse.json({ success: true, message: "Guard deleted" });
                }
                break;
            }

            case "inventory": {
                if (actionType === "create") {
                    const { error } = await supabase.from("inventory_items").insert({
                        name: data.name,
                        category: data.category || "Other",
                        tracking_type: data.tracking_type || "quantity",
                        branch_id: branchId as string,
                        total_quantity: data.quantity || 0
                    });
                    if (error) throw error;
                    return NextResponse.json({ success: true, message: `Inventory item "${data.name}" created` });
                }
                if (actionType === "assign") {
                    // Assign item to guard or place
                    const itemName = data.item_name;
                    const targetName = data.target_name;
                    const targetType = data.target_type; // "guard" or "place"

                    if (!itemName || !targetName || !targetType) {
                        return NextResponse.json({ error: "Missing required fields: item_name, target_name, target_type" }, { status: 400 });
                    }

                    // Resolve IDs
                    const itemId = await resolveEntityId(supabase, "inventory_items", itemName as string, branchId as string);
                    const targetId = await resolveEntityId(supabase, targetType === "guard" ? "guards" : "places", targetName as string, branchId as string);

                    if (!itemId) return NextResponse.json({ error: `Item "${itemName}" not found` }, { status: 404 });
                    if (!targetId) return NextResponse.json({ error: `${targetType} "${targetName}" not found` }, { status: 404 });

                    const payload: any = {
                        branch_id: branchId,
                        item_id: itemId,
                        assigned_to_type: targetType,
                        quantity: data.quantity || 1,
                        assigned_at: new Date().toISOString()
                    };

                    if (targetType === "guard") payload.guard_id = targetId;
                    else payload.place_id = targetId;

                    const { error } = await supabase.from("inventory_assignments").insert(payload);
                    if (error) throw error;

                    return NextResponse.json({ success: true, message: `Assigned ${data.quantity || 1} ${itemName} to ${targetName}` });
                }
                if (actionType === "list") {
                    let query = supabase.from("inventory_items").select("id, name, category, total_quantity").order("name");
                    if (profile.role === "branch_admin" && branchId) {
                        query = query.eq("branch_id", branchId);
                    }
                    const { data: items, error } = await query.limit(20);
                    if (error) throw error;
                    return NextResponse.json({ success: true, data: items });
                }
                break;
            }

            case "assignment": {
                if (actionType === "create") {
                    const guardName = data.guard_name;
                    const placeName = data.place_name;

                    if (!guardName || !placeName) {
                        return NextResponse.json({ error: "Guard name and Place name are required" }, { status: 400 });
                    }

                    const guardId = await resolveEntityId(supabase, "guards", guardName as string, branchId as string);
                    const placeId = await resolveEntityId(supabase, "places", placeName as string, branchId as string);

                    if (!guardId) return NextResponse.json({ error: `Guard "${guardName}" not found` }, { status: 404 });
                    if (!placeId) return NextResponse.json({ error: `Place "${placeName}" not found` }, { status: 404 });

                    const { error } = await supabase.from("assignments").insert({
                        branch_id: branchId!,
                        guard_id: guardId,
                        place_id: placeId,
                        start_date: data.start_date || new Date().toISOString().split('T')[0],
                        shift_type: data.shift_type || "day",
                        status: "active"
                    });

                    if (error) throw error;
                    return NextResponse.json({ success: true, message: `Assigned ${guardName} to ${placeName}` });
                }
                if (actionType === "list") {
                    let query = supabase
                        .from("assignments")
                        .select("id, start_date, shift_type, status, guard:guards(name), place:places(name)")
                        .eq("status", "active")
                        .order("start_date", { ascending: false });

                    if (profile.role === "branch_admin" && branchId) {
                        query = query.eq("branch_id", branchId);
                    }

                    const { data: assignments, error } = await query.limit(20);
                    if (error) throw error;

                    // Flatten for AI
                    const flatAssignments = assignments?.map((a: any) => ({
                        id: a.id,
                        guard: a.guard?.name,
                        place: a.place?.name,
                        shift: a.shift_type,
                        since: a.start_date
                    }));

                    return NextResponse.json({ success: true, data: flatAssignments });
                }
                break;
            }

            case "lead": {
                if (actionType === "list") {
                    let query = supabase
                        .from("service_requests")
                        .select("id, request_number, customer_name, service_type, status, created_at")
                        .order("created_at", { ascending: false });
                    if (profile.role === "branch_admin" && branchId) {
                        query = query.eq("branch_id", branchId);
                    }
                    const { data: leads, error } = await query.limit(10);
                    if (error) throw error;
                    return NextResponse.json({ success: true, data: leads });
                }
                if (actionType === "update" && data.id && data.status) {
                    const { error } = await supabase
                        .from("service_requests")
                        .update({ status: data.status, updated_at: new Date().toISOString() })
                        .eq("id", data.id);
                    if (error) throw error;
                    return NextResponse.json({ success: true, message: "Lead status updated" });
                }
                break;
            }

            case "report": {
                const reportType = data.report_type as string;
                const now = new Date();
                const startDate = (data.start_date as string) || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                const endDate = (data.end_date as string) || now.toISOString().split('T')[0];

                if (reportType === "guard_attendance") {
                    // Resolve guard by name
                    let guardFilter: string | null = null;
                    if (data.guard_name) {
                        guardFilter = await resolveEntityId(supabase, "guards", data.guard_name as string, branchId as string);
                        if (!guardFilter) {
                            return NextResponse.json({ error: `Guard "${data.guard_name}" not found` }, { status: 404 });
                        }
                    }

                    // Fetch attendance records
                    let query = supabase
                        .from("attendance")
                        .select(`*, assignment:assignments(id, shift_type, guard:guards(id, name, guard_code, photo_url, branch_id), place:places(id, name, city, branch_id))`)
                        .gte("date", startDate)
                        .lte("date", endDate)
                        .order("date");

                    const { data: attendance, error: attError } = await query;
                    if (attError) throw attError;

                    let filtered = attendance || [];

                    // Filter by branch
                    if (profile.role === "branch_admin" && branchId) {
                        filtered = filtered.filter((a: any) => a.assignment?.guard?.branch_id === branchId);
                    }

                    // Filter by guard
                    if (guardFilter) {
                        filtered = filtered.filter((a: any) => a.assignment?.guard?.id === guardFilter);
                    }

                    // Group by guard
                    const guardMap = new Map<string, any>();
                    filtered.forEach((record: any) => {
                        const assignment = record.assignment;
                        if (!assignment?.guard) return;
                        const guardId = assignment.guard.id;
                        if (!guardMap.has(guardId)) {
                            guardMap.set(guardId, {
                                guard: assignment.guard,
                                place: assignment.place,
                                attendance: [],
                                summary: { present: 0, absent: 0, late: 0, half_day: 0, leave: 0, total_days: 0, attendance_rate: 0 },
                                inventory: [],
                            });
                        }
                        const gd = guardMap.get(guardId)!;
                        gd.attendance.push({
                            date: record.date, shift: record.shift, status: record.status,
                            check_in_time: record.check_in_time, check_out_time: record.check_out_time,
                        });
                        gd.summary.total_days++;
                        if (record.status === "present") gd.summary.present++;
                        else if (record.status === "absent") gd.summary.absent++;
                        else if (record.status === "late") gd.summary.late++;
                        else if (record.status === "half_day") gd.summary.half_day++;
                        else if (record.status === "leave") gd.summary.leave++;
                    });

                    guardMap.forEach((gd) => {
                        const workDays = gd.summary.present + gd.summary.late + gd.summary.half_day * 0.5;
                        gd.summary.attendance_rate = gd.summary.total_days > 0
                            ? Math.round((workDays / gd.summary.total_days) * 100) : 0;
                    });

                    const reportData = Array.from(guardMap.values());
                    const label = data.guard_name
                        ? `Guard Attendance — ${data.guard_name}`
                        : "Guard Attendance Report";

                    return NextResponse.json({
                        success: true,
                        report: {
                            reportType: "guard_attendance",
                            data: reportData,
                            period: { start: startDate, end: endDate },
                            label,
                        },
                    });
                }

                if (reportType === "place") {
                    if (!data.place_name) {
                        return NextResponse.json({ error: "Place name is required for a place report" }, { status: 400 });
                    }

                    const placeId = await resolveEntityId(supabase, "places", data.place_name as string, branchId as string);
                    if (!placeId) {
                        return NextResponse.json({ error: `Place "${data.place_name}" not found` }, { status: 404 });
                    }

                    // Get place details
                    const { data: place } = await supabase.from("places").select("*").eq("id", placeId).single();
                    if (!place) return NextResponse.json({ error: "Place not found" }, { status: 404 });

                    // Get active assignments
                    const { data: assignments } = await supabase
                        .from("assignments")
                        .select(`id, shift_type, start_date, end_date, guard:guards(id, name, guard_code)`)
                        .eq("place_id", placeId)
                        .eq("status", "active");

                    // Get attendance summary
                    const { data: attendanceRecords } = await supabase
                        .from("attendance")
                        .select("status")
                        .eq("place_id", placeId)
                        .gte("date", startDate)
                        .lte("date", endDate);

                    const att = attendanceRecords || [];
                    const attSummary = {
                        total_records: att.length,
                        total_days: att.length,
                        present: att.filter((a) => a.status === "present").length,
                        absent: att.filter((a) => a.status === "absent").length,
                        late: att.filter((a) => a.status === "late").length,
                        half_day: att.filter((a) => a.status === "half_day").length,
                        leave: att.filter((a) => a.status === "leave").length,
                        attendance_rate: 0,
                    };
                    if (attSummary.total_records > 0) {
                        attSummary.attendance_rate = Math.round(((attSummary.present + attSummary.late) / attSummary.total_records) * 100);
                    }

                    // Get inventory
                    const { data: invAssignments } = await supabase
                        .from("inventory_assignments")
                        .select(`id, quantity, assigned_at, item:inventory_items!item_id(name), unit:inventory_units(serial_number), guard:guards(name)`)
                        .eq("place_id", placeId)
                        .is("returned_at", null);

                    const reportData = {
                        place: {
                            id: place.id, name: place.name, address: place.address,
                            city: place.city, contact_person: place.contact_person, contact_phone: place.contact_phone,
                        },
                        guards: assignments?.map((a: any) => ({
                            id: a.guard?.id || "", name: a.guard?.name || "Unknown",
                            guard_code: a.guard?.guard_code || "", shift: a.shift_type,
                            start_date: a.start_date, end_date: a.end_date,
                        })).filter((g: any) => g.id) || [],
                        attendance_summary: attSummary,
                        inventory: invAssignments?.map((a: any) => ({
                            id: a.id, item_name: a.item?.name || "Unknown",
                            serial_number: a.unit?.serial_number || null,
                            quantity: a.quantity, assigned_at: a.assigned_at,
                            assigned_to_guard: a.guard?.name || null,
                        })) || [],
                        period: { start: startDate, end: endDate },
                    };

                    return NextResponse.json({
                        success: true,
                        report: {
                            reportType: "place",
                            data: reportData,
                            period: { start: startDate, end: endDate },
                            label: `Place Report — ${place.name}`,
                        },
                    });
                }

                if (reportType === "monthly_summary") {
                    // Compute monthly stats
                    let guardsQuery = supabase.from("guards").select("id", { count: "exact", head: true }).eq("status", "active");
                    let placesQuery = supabase.from("places").select("id", { count: "exact", head: true }).eq("status", "active");
                    let assignmentsQuery = supabase.from("assignments").select("id", { count: "exact", head: true }).eq("status", "active");

                    if (profile.role === "branch_admin" && branchId) {
                        guardsQuery = guardsQuery.eq("branch_id", branchId);
                        placesQuery = placesQuery.eq("branch_id", branchId);
                        assignmentsQuery = assignmentsQuery.eq("branch_id", branchId);
                    }

                    const [{ count: totalGuards }, { count: totalPlaces }, { count: activeAssignments }] = await Promise.all([
                        guardsQuery, placesQuery, assignmentsQuery,
                    ]);

                    // Attendance this month
                    let attQuery = supabase.from("attendance").select("status").gte("date", startDate).lte("date", endDate);
                    const { data: monthAtt } = await attQuery;
                    const ma = monthAtt || [];

                    // Invoices this month
                    let invQuery = supabase.from("invoices").select("total_amount, status, total").gte("created_at", startDate).lte("created_at", endDate + "T23:59:59");
                    if (profile.role === "branch_admin" && branchId) {
                        invQuery = invQuery.eq("branch_id", branchId);
                    }
                    const { data: monthInv } = await invQuery;
                    const mi = (monthInv || []) as unknown as { total_amount: number; total: number; status: string }[];

                    const reportData = {
                        month: now.toLocaleString("default", { month: "long" }),
                        year: now.getFullYear(),
                        stats: {
                            totalGuards: totalGuards || 0,
                            totalPlaces: totalPlaces || 0,
                            activeAssignments: activeAssignments || 0,
                            totalAttendance: ma.length,
                            presentDays: ma.filter((a) => a.status === "present").length,
                            absentDays: ma.filter((a) => a.status === "absent").length,
                            attendanceRate: ma.length > 0
                                ? Math.round((ma.filter((a) => a.status === "present" || a.status === "late").length / ma.length) * 100)
                                : 0,
                            totalRevenue: mi.reduce((sum, inv) => sum + (inv.total_amount || inv.total || 0), 0),
                            paidAmount: mi.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + (inv.total_amount || inv.total || 0), 0),
                            pendingInvoices: mi.filter((inv) => inv.status === "pending" || inv.status === "sent").length,
                        },
                    };

                    return NextResponse.json({
                        success: true,
                        report: {
                            reportType: "monthly_summary",
                            data: reportData,
                            period: { start: startDate, end: endDate },
                            label: `Monthly Summary — ${reportData.month} ${reportData.year}`,
                        },
                    });
                }

                return NextResponse.json({ error: `Unknown report type: ${reportType}` }, { status: 400 });
            }

            default:
                return NextResponse.json(
                    { error: `Unsupported entity: ${entity}` },
                    { status: 400 }
                );
        }

        return NextResponse.json(
            { error: `Unsupported action: ${actionType} on ${entity}` },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("Execute action error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to execute action" },
            { status: 500 }
        );
    }
}
