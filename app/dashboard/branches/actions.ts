"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { branchSchema, type BranchFormData } from "@/lib/validations";

export async function createBranch(data: BranchFormData) {
  try {
    const validated = branchSchema.parse(data);
    const supabase = await createClient();

    // Check if user is super_admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id || "")
      .single();

    if (profile?.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Insert the branch
    const { data: newBranch, error } = await supabase
      .from("branches")
      .insert({
        name: validated.name,
        city: validated.city,
        address: validated.address,
        phone: validated.phone,
      })
      .select("id")
      .single();

    if (error || !newBranch) {
      console.error("Error creating branch:", error);
      return { success: false, error: error?.message || "Failed to create branch" };
    }

    // If admin credentials provided, create auth user for this branch
    if (validated.admin_email && validated.admin_password) {
      const adminClient = createAdminClient();

      // Create auth user with service role (skips email verification)
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: validated.admin_email,
        password: validated.admin_password,
        email_confirm: true,
        user_metadata: {
          role: "branch_admin",
          full_name: validated.name + " Admin",
        },
      });

      if (authError) {
        console.error("Error creating branch admin user:", authError);
        // Branch was created but admin user failed — report partial success
        return {
          success: true,
          warning: `Branch created but admin account failed: ${authError.message}`,
        };
      }

      // Fix NULL token columns to prevent GoTrue scan errors on login
      try {
        await adminClient.rpc("exec_sql" as never, {
          query: `UPDATE auth.users SET 
            confirmation_token = COALESCE(confirmation_token, ''),
            recovery_token = COALESCE(recovery_token, ''),
            email_change_token_new = COALESCE(email_change_token_new, ''),
            email_change_token_current = COALESCE(email_change_token_current, ''),
            reauthentication_token = COALESCE(reauthentication_token, ''),
            email_change = COALESCE(email_change, ''),
            phone_change = COALESCE(phone_change, ''),
            phone_change_token = COALESCE(phone_change_token, '')
          WHERE id = '${authUser.user.id}'`,
        } as never);
      } catch {
        // If rpc doesn't exist, the fix must be applied manually
        console.warn("Could not fix token columns via RPC — may need manual SQL fix");
      }

      // The handle_new_user trigger auto-creates a profile with role='branch_admin'
      // Now link the profile to this branch
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ branch_id: newBranch.id } as Record<string, unknown>)
        .eq("id", authUser.user.id);

      if (profileError) {
        console.error("Error linking profile to branch:", profileError);
        return {
          success: true,
          warning: `Branch & admin created but branch linking failed: ${profileError.message}`,
        };
      }
    }

    revalidatePath("/dashboard/branches");
    return { success: true };
  } catch (error) {
    console.error("Create branch error:", error);
    return { success: false, error: "Invalid form data" };
  }
}

export async function updateBranch(id: string, data: BranchFormData) {
  try {
    const validated = branchSchema.parse(data);
    const supabase = await createClient();

    // Check if user is super_admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id || "")
      .single();

    if (profile?.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("branches")
      .update({
        name: validated.name,
        city: validated.city,
        address: validated.address,
        phone: validated.phone,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating branch:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/branches");
    revalidatePath(`/dashboard/branches/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Update branch error:", error);
    return { success: false, error: "Invalid form data" };
  }
}

export async function deleteBranch(id: string) {
  try {
    const supabase = await createClient();

    // Check if user is super_admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id || "")
      .single();

    if (profile?.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Check if branch has places or guards
    const [{ count: placeCount }, { count: guardCount }] = await Promise.all([
      supabase
        .from("places")
        .select("*", { count: "exact", head: true })
        .eq("branch_id", id),
      supabase
        .from("guards")
        .select("*", { count: "exact", head: true })
        .eq("branch_id", id),
    ]);

    if ((placeCount || 0) > 0 || (guardCount || 0) > 0) {
      return {
        success: false,
        error: "Cannot delete branch with existing places or guards",
      };
    }

    const { error } = await supabase.from("branches").delete().eq("id", id);

    if (error) {
      console.error("Error deleting branch:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/branches");
    return { success: true };
  } catch (error) {
    console.error("Delete branch error:", error);
    return { success: false, error: "Failed to delete branch" };
  }
}
