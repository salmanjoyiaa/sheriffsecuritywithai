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
