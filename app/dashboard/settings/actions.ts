"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CompanySettings {
  id: string;
  company_name: string;
  tagline: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  phone_secondary: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  invoice_prefix: string;
  invoice_footer: string | null;
  tax_rate: number;
  created_at: string | null;
  updated_at: string | null;
}

export async function getCompanySettings(): Promise<{
  data?: CompanySettings;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Check if user is super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return { error: "Only super admins can access company settings" };
  }

  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") {
    return { error: error.message };
  }

  return { data: data || undefined };
}

export async function updateCompanySettings(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Check if user is super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return { error: "Only super admins can update company settings" };
  }

  const id = formData.get("id") as string | null;
  const company_name = formData.get("company_name") as string;
  const tagline = formData.get("tagline") as string | null;
  const address = formData.get("address") as string | null;
  const city = formData.get("city") as string | null;
  const phone = formData.get("phone") as string | null;
  const phone_secondary = formData.get("phone_secondary") as string | null;
  const email = formData.get("email") as string | null;
  const website = formData.get("website") as string | null;
  const invoice_prefix = formData.get("invoice_prefix") as string;
  const invoice_footer = formData.get("invoice_footer") as string | null;
  const tax_rate = parseFloat(formData.get("tax_rate") as string) || 0;

  if (!company_name) {
    return { error: "Company name is required" };
  }

  const settingsData = {
    company_name,
    tagline: tagline || null,
    address: address || null,
    city: city || null,
    phone: phone || null,
    phone_secondary: phone_secondary || null,
    email: email || null,
    website: website || null,
    invoice_prefix: invoice_prefix || "INV",
    invoice_footer: invoice_footer || null,
    tax_rate,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    // Update existing
    const { error } = await supabase
      .from("company_settings")
      .update(settingsData)
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from("company_settings")
      .insert(settingsData);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/dashboard/settings");
  return {};
}

export async function uploadCompanyLogo(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Check if user is super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return { error: "Only super admins can upload company logo" };
  }

  const file = formData.get("logo") as File;

  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Invalid file type. Please upload a JPG, PNG, WebP, or SVG image." };
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { error: "File too large. Maximum size is 2MB." };
  }

  const ext = file.name.split(".").pop();
  const fileName = `company-logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("company_assets")
    .upload(fileName, file, {
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("company_assets").getPublicUrl(fileName);

  // Update company settings with the logo URL
  const { data: existingSettings } = await supabase
    .from("company_settings")
    .select("id")
    .single();

  if (existingSettings) {
    await supabase
      .from("company_settings")
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", existingSettings.id);
  }

  revalidatePath("/dashboard/settings");
  return { url: publicUrl };
}

export async function getUserProfile(): Promise<{
  data?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    branch_id: string | null;
    branch_name: string | null;
    created_at: string;
  };
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      role,
      branch_id,
      created_at,
      branches:branch_id (name)
    `
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  return {
    data: {
      id: profile.id,
      email: user.email || "",
      full_name: profile.full_name,
      role: profile.role,
      branch_id: profile.branch_id,
      branch_name: (profile.branches as { name: string } | null)?.name || null,
      created_at: profile.created_at,
    },
  };
}

export async function updateUserProfile(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const full_name = formData.get("full_name") as string;

  if (!full_name) {
    return { error: "Full name is required" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return {};
}

export async function changePassword(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!newPassword || !confirmPassword) {
    return { error: "Please fill in all password fields" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}
