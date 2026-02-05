"use server";

import { createClient } from "@/lib/supabase/server";
import { guardSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createGuard(formData: FormData) {
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
    guard_code: formData.get("guard_code") as string,
    name: formData.get("name") as string,
    cnic: formData.get("cnic") as string,
    phone: formData.get("phone") as string || undefined,
    address: formData.get("address") as string || undefined,
    branch_id: formData.get("branch_id") as string || profile.branch_id,
    status: formData.get("status") as string || "active",
    notes: formData.get("notes") as string || undefined,
  };

  const validatedData = guardSchema.safeParse(rawData);
  if (!validatedData.success) {
    console.error("Validation error:", validatedData.error.errors);
    return { error: validatedData.error.errors[0].message };
  }

  // For branch_admin, force branch_id to their branch
  const finalBranchId = profile.role === "branch_admin" 
    ? profile.branch_id 
    : validatedData.data.branch_id;

  if (!finalBranchId) {
    return { error: "Branch is required" };
  }

  // Check if guard_code is unique within the branch
  const { data: existingGuard } = await supabase
    .from("guards")
    .select("id")
    .eq("guard_code", validatedData.data.guard_code)
    .eq("branch_id", finalBranchId)
    .single();

  if (existingGuard) {
    return { error: "Guard code already exists in this branch" };
  }

  const { error } = await supabase.from("guards").insert({
    guard_code: validatedData.data.guard_code,
    name: validatedData.data.name,
    cnic: validatedData.data.cnic,
    phone: validatedData.data.phone || null,
    address: validatedData.data.address || null,
    branch_id: finalBranchId,
    status: validatedData.data.status,
    notes: validatedData.data.notes || null,
  });

  if (error) {
    console.error("Error creating guard:", error);
    if (error.code === "23505") {
      return { error: "Guard with this CNIC already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/guards");
  redirect("/dashboard/guards");
}

export async function updateGuard(id: string, formData: FormData) {
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
    guard_code: formData.get("guard_code") as string,
    name: formData.get("name") as string,
    cnic: formData.get("cnic") as string,
    phone: formData.get("phone") as string || undefined,
    address: formData.get("address") as string || undefined,
    branch_id: formData.get("branch_id") as string,
    status: formData.get("status") as string || "active",
    notes: formData.get("notes") as string || undefined,
  };

  const validatedData = guardSchema.safeParse(rawData);
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

  // Check if guard_code is unique within the branch (excluding current guard)
  const { data: existingGuard } = await supabase
    .from("guards")
    .select("id")
    .eq("guard_code", validatedData.data.guard_code)
    .eq("branch_id", finalBranchId)
    .neq("id", id)
    .single();

  if (existingGuard) {
    return { error: "Guard code already exists in this branch" };
  }

  const { error } = await supabase
    .from("guards")
    .update({
      guard_code: validatedData.data.guard_code,
      name: validatedData.data.name,
      cnic: validatedData.data.cnic,
      phone: validatedData.data.phone ?? null,
      address: validatedData.data.address ?? null,
      branch_id: finalBranchId,
      status: validatedData.data.status,
      notes: validatedData.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating guard:", error);
    if (error.code === "23505") {
      return { error: "Guard with this CNIC already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/guards");
  redirect("/dashboard/guards");
}

export async function deleteGuard(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check for active assignments
  const { data: activeAssignments } = await supabase
    .from("assignments")
    .select("id")
    .eq("guard_id", id)
    .eq("status", "active")
    .limit(1);

  if (activeAssignments && activeAssignments.length > 0) {
    return { error: "Cannot delete guard with active assignments" };
  }

  const { error } = await supabase.from("guards").delete().eq("id", id);

  if (error) {
    console.error("Error deleting guard:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/guards");
  redirect("/dashboard/guards");
}

export async function uploadGuardPhoto(guardId: string, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("photo") as File;
  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File too large. Maximum size is 5MB." };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${guardId}.${fileExt}`;
  const filePath = `guard_photos/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("guard_photos")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading photo:", uploadError);
    return { error: uploadError.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("guard_photos")
    .getPublicUrl(filePath);

  // Update guard record
  const { error: updateError } = await supabase
    .from("guards")
    .update({ photo_url: urlData.publicUrl })
    .eq("id", guardId);

  if (updateError) {
    console.error("Error updating guard photo URL:", updateError);
    return { error: updateError.message };
  }

  revalidatePath("/dashboard/guards");
  revalidatePath(`/dashboard/guards/${guardId}`);
  
  return { success: true, url: urlData.publicUrl };
}
