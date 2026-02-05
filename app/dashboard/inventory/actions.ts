"use server";

import { createClient } from "@/lib/supabase/server";
import { inventoryItemSchema, inventoryUnitSchema, inventoryAssignmentSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Inventory Items CRUD
export async function createInventoryItem(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user profile to determine branch_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  const branchId = formData.get("branch_id") as string || profile.branch_id;
  if (!branchId) {
    return { error: "Could not determine branch" };
  }

  const rawData = {
    branch_id: branchId,
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    tracking_type: formData.get("tracking_type") as string || "quantity",
    total_quantity: parseInt(formData.get("total_quantity") as string || "0", 10),
  };

  const validatedData = inventoryItemSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  const { error } = await supabase.from("inventory_items").insert({
    branch_id: validatedData.data.branch_id,
    name: validatedData.data.name,
    category: validatedData.data.category,
    tracking_type: validatedData.data.tracking_type,
    total_quantity: validatedData.data.total_quantity,
  });

  if (error) {
    console.error("Error creating inventory item:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/inventory");
}

export async function updateInventoryItem(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get existing item to get branch_id
  const { data: existingItem } = await supabase
    .from("inventory_items")
    .select("branch_id")
    .eq("id", id)
    .single();

  if (!existingItem) {
    return { error: "Item not found" };
  }

  const rawData = {
    branch_id: existingItem.branch_id,
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    tracking_type: formData.get("tracking_type") as string || "quantity",
    total_quantity: parseInt(formData.get("total_quantity") as string || "0", 10),
  };

  const validatedData = inventoryItemSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: validatedData.data.name,
      category: validatedData.data.category,
      tracking_type: validatedData.data.tracking_type,
      total_quantity: validatedData.data.total_quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating inventory item:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/inventory");
}

export async function deleteInventoryItem(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if there are units associated with this item
  const { data: units } = await supabase
    .from("inventory_units")
    .select("id")
    .eq("item_id", id)
    .limit(1);

  if (units && units.length > 0) {
    return { error: "Cannot delete item with inventory units. Delete units first." };
  }

  const { error } = await supabase.from("inventory_items").delete().eq("id", id);

  if (error) {
    console.error("Error deleting inventory item:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/inventory");
}

// Inventory Units CRUD
export async function createInventoryUnit(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  const rawData = {
    item_id: formData.get("item_id") as string,
    serial_number: formData.get("serial_number") as string,
    branch_id: formData.get("branch_id") as string,
    status: formData.get("status") as string || "available",
    notes: formData.get("notes") as string || undefined,
  };

  const validatedData = inventoryUnitSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  // For branch_admin, force branch_id to their branch
  const finalBranchId = profile.role === "branch_admin" 
    ? profile.branch_id 
    : validatedData.data.branch_id;

  if (!finalBranchId) {
    return { error: "Branch is required" };
  }

  const { error } = await supabase.from("inventory_units").insert({
    item_id: validatedData.data.item_id,
    serial_number: validatedData.data.serial_number,
    branch_id: finalBranchId,
    status: validatedData.data.status,
  });

  if (error) {
    console.error("Error creating inventory unit:", error);
    if (error.code === "23505") {
      return { error: "Serial number already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function updateInventoryUnit(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const rawData = {
    item_id: formData.get("item_id") as string,
    serial_number: formData.get("serial_number") as string,
    branch_id: formData.get("branch_id") as string,
    status: formData.get("status") as string || "available",
  };

  const validatedData = inventoryUnitSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  const { error } = await supabase
    .from("inventory_units")
    .update({
      item_id: validatedData.data.item_id,
      serial_number: validatedData.data.serial_number,
      branch_id: validatedData.data.branch_id,
      status: validatedData.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating inventory unit:", error);
    if (error.code === "23505") {
      return { error: "Serial number already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function deleteInventoryUnit(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if unit is assigned
  const { data: assignments } = await supabase
    .from("inventory_assignments")
    .select("id")
    .eq("unit_id", id)
    .is("returned_at", null)
    .limit(1);

  if (assignments && assignments.length > 0) {
    return { error: "Cannot delete unit that is currently assigned. Return it first." };
  }

  const { error } = await supabase.from("inventory_units").delete().eq("id", id);

  if (error) {
    console.error("Error deleting inventory unit:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

// Inventory Assignments
export async function assignInventoryUnit(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user profile to determine branch_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  const itemId = formData.get("item_id") as string;
  const unitId = formData.get("unit_id") as string;
  const guardId = formData.get("guard_id") as string;
  const placeId = formData.get("place_id") as string;
  const assignedToType = formData.get("assigned_to_type") as string || (guardId ? "guard" : "place");
  const quantity = parseInt(formData.get("quantity") as string || "1", 10);

  // Determine branch_id and item_id for units
  let branchId = profile.branch_id;
  let resolvedItemId = itemId;
  
  // For serialised items (with unit), get the unit's branch and item_id
  if (unitId) {
    const { data: unit } = await supabase
      .from("inventory_units")
      .select("item_id, branch_id")
      .eq("id", unitId)
      .single();

    if (!unit) {
      return { error: "Unit not found" };
    }
    
    branchId = profile.role === "branch_admin" ? profile.branch_id : unit.branch_id;
    resolvedItemId = unit.item_id; // Get item_id from the unit
  } else if (itemId) {
    // For quantity items, get the item's branch
    const { data: item } = await supabase
      .from("inventory_items")
      .select("branch_id")
      .eq("id", itemId)
      .single();
      
    if (!item) {
      return { error: "Item not found" };
    }
    
    branchId = profile.role === "branch_admin" ? profile.branch_id : item.branch_id;
  }

  const rawData = {
    branch_id: branchId,
    assigned_to_type: assignedToType,
    place_id: placeId || null,
    guard_id: guardId || null,
    item_id: resolvedItemId || null,
    unit_id: unitId || null,
    quantity: unitId ? 1 : quantity,
    notes: formData.get("notes") as string || undefined,
  };

  const validatedData = inventoryAssignmentSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  // For serialised items, check if unit is already assigned
  if (validatedData.data.unit_id) {
    const { data: existingAssignment } = await supabase
      .from("inventory_assignments")
      .select("id")
      .eq("unit_id", validatedData.data.unit_id)
      .is("returned_at", null)
      .single();

    if (existingAssignment) {
      return { error: "This unit is already assigned. Return it first." };
    }
  }

  // For quantity items, check if there's enough stock
  if (validatedData.data.item_id && !validatedData.data.unit_id) {
    const { data: item } = await supabase
      .from("inventory_items")
      .select("total_quantity")
      .eq("id", validatedData.data.item_id)
      .single();

    if (!item || (item.total_quantity || 0) < quantity) {
      return { error: "Not enough quantity available" };
    }

    // Decrease the item quantity
    await supabase
      .from("inventory_items")
      .update({ total_quantity: (item.total_quantity || 0) - quantity })
      .eq("id", validatedData.data.item_id);
  }

  // Ensure we have an item_id
  const finalItemId = validatedData.data.item_id;
  if (!finalItemId) {
    return { error: "Item is required" };
  }

  // Create assignment
  const { error: assignmentError } = await supabase.from("inventory_assignments").insert({
    branch_id: validatedData.data.branch_id,
    assigned_to_type: validatedData.data.assigned_to_type,
    place_id: validatedData.data.place_id ?? null,
    guard_id: validatedData.data.guard_id ?? null,
    item_id: finalItemId,
    unit_id: validatedData.data.unit_id ?? null,
    quantity: validatedData.data.quantity,
    notes: validatedData.data.notes || null,
  });

  if (assignmentError) {
    console.error("Error creating assignment:", assignmentError);
    return { error: assignmentError.message };
  }

  // Update unit status to assigned (only for serialised items)
  if (validatedData.data.unit_id) {
    await supabase
      .from("inventory_units")
      .update({ status: "assigned" })
      .eq("id", validatedData.data.unit_id);
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function returnInventoryUnit(assignmentId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the assignment to find the unit and/or item
  const { data: assignment } = await supabase
    .from("inventory_assignments")
    .select("unit_id, item_id, quantity")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return { error: "Assignment not found" };
  }

  // Update assignment with return date
  const { error: updateError } = await supabase
    .from("inventory_assignments")
    .update({
      returned_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  if (updateError) {
    console.error("Error returning unit:", updateError);
    return { error: updateError.message };
  }

  // For serialised items, update unit status to available
  if (assignment.unit_id) {
    await supabase
      .from("inventory_units")
      .update({ status: "available" })
      .eq("id", assignment.unit_id);
  }

  // For quantity items, restore the quantity to the item
  if (assignment.item_id && !assignment.unit_id) {
    const { data: item } = await supabase
      .from("inventory_items")
      .select("total_quantity")
      .eq("id", assignment.item_id)
      .single();

    if (item) {
      await supabase
        .from("inventory_items")
        .update({ total_quantity: (item.total_quantity || 0) + (assignment.quantity || 1) })
        .eq("id", assignment.item_id);
    }
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}
