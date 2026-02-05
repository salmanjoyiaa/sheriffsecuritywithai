"use server";

import { createClient } from "@/lib/supabase/server";
import { placeSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPlace(formData: FormData) {
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

  const rawData = {
    name: formData.get("name") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    contact_person: formData.get("contact_person") as string || undefined,
    contact_phone: formData.get("contact_phone") as string || undefined,
    branch_id: formData.get("branch_id") as string,
    status: formData.get("status") as string || "active",
    notes: formData.get("notes") as string || undefined,
  };

  const validatedData = placeSchema.safeParse(rawData);
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

  const { error } = await supabase.from("places").insert({
    name: validatedData.data.name,
    address: validatedData.data.address,
    city: validatedData.data.city,
    contact_person: validatedData.data.contact_person ?? null,
    contact_phone: validatedData.data.contact_phone ?? null,
    branch_id: finalBranchId,
    status: validatedData.data.status,
    notes: validatedData.data.notes ?? null,
  });

  if (error) {
    console.error("Error creating place:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/places");
  redirect("/dashboard/places");
}

export async function updatePlace(id: string, formData: FormData) {
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

  const rawData = {
    name: formData.get("name") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    contact_person: formData.get("contact_person") as string || undefined,
    contact_phone: formData.get("contact_phone") as string || undefined,
    branch_id: formData.get("branch_id") as string,
    status: formData.get("status") as string || "active",
    notes: formData.get("notes") as string || undefined,
  };

  const validatedData = placeSchema.safeParse(rawData);
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

  const { error } = await supabase
    .from("places")
    .update({
      name: validatedData.data.name,
      address: validatedData.data.address,
      city: validatedData.data.city,
      contact_person: validatedData.data.contact_person ?? null,
      contact_phone: validatedData.data.contact_phone ?? null,
      branch_id: finalBranchId,
      status: validatedData.data.status,
      notes: validatedData.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating place:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/places");
  redirect("/dashboard/places");
}

export async function deletePlace(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check for active assignments
  const { data: activeAssignments } = await supabase
    .from("assignments")
    .select("id")
    .eq("place_id", id)
    .eq("status", "active")
    .limit(1);

  if (activeAssignments && activeAssignments.length > 0) {
    return { error: "Cannot delete place with active assignments" };
  }

  const { error } = await supabase.from("places").delete().eq("id", id);

  if (error) {
    console.error("Error deleting place:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/places");
  redirect("/dashboard/places");
}
