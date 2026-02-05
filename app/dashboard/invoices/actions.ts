"use server";

import { createClient } from "@/lib/supabase/server";
import { invoiceSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export async function createInvoice(formData: FormData) {
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

  const lineItemsJson = formData.get("line_items") as string;
  let lineItems: LineItem[] = [];
  try {
    lineItems = JSON.parse(lineItemsJson);
  } catch {
    return { error: "Invalid line items" };
  }

  // Get branch_id from the place (for super_admin) or use user's branch_id
  const placeId = formData.get("place_id") as string;
  let branchId = profile.branch_id;

  if (profile.role === "super_admin") {
    const { data: place } = await supabase
      .from("places")
      .select("branch_id")
      .eq("id", placeId)
      .single();
    
    if (place) {
      branchId = place.branch_id;
    }
  }

  if (!branchId) {
    return { error: "Could not determine branch" };
  }

  const rawData = {
    place_id: formData.get("place_id") as string,
    invoice_number: formData.get("invoice_number") as string,
    invoice_date: formData.get("invoice_date") as string,
    due_date: formData.get("due_date") as string,
    period_start: formData.get("period_start") as string,
    period_end: formData.get("period_end") as string,
    subtotal: parseFloat(formData.get("subtotal") as string),
    tax_rate: parseFloat(formData.get("tax_rate") as string) || 0,
    tax_amount: parseFloat(formData.get("tax_amount") as string) || 0,
    total: parseFloat(formData.get("total") as string),
    status: formData.get("status") as string || "draft",
    notes: formData.get("notes") as string || undefined,
    line_items: lineItems,
  };

  const validatedData = invoiceSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  // Check for duplicate invoice number
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("invoice_number", validatedData.data.invoice_number)
    .single();

  if (existingInvoice) {
    return { error: "Invoice number already exists" };
  }

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      branch_id: branchId,
      place_id: validatedData.data.place_id,
      invoice_number: validatedData.data.invoice_number,
      invoice_date: validatedData.data.invoice_date,
      due_date: validatedData.data.due_date,
      period_start: validatedData.data.period_start,
      period_end: validatedData.data.period_end,
      subtotal: validatedData.data.subtotal,
      tax_rate: validatedData.data.tax_rate,
      tax_amount: validatedData.data.tax_amount,
      total: validatedData.data.total,
      status: validatedData.data.status,
      notes: validatedData.data.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    console.error("Error creating invoice:", invoiceError);
    return { error: invoiceError?.message || "Failed to create invoice" };
  }

  // Create line items
  if (lineItems.length > 0) {
    const { error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .insert(
        lineItems.map((item, index) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          sort_order: index,
        }))
      );

    if (lineItemsError) {
      console.error("Error creating line items:", lineItemsError);
      // Invoice created but line items failed - we should ideally rollback
      return { error: "Invoice created but failed to add line items" };
    }
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const lineItemsJson = formData.get("line_items") as string;
  let lineItems: LineItem[] = [];
  try {
    lineItems = JSON.parse(lineItemsJson);
  } catch {
    return { error: "Invalid line items" };
  }

  const rawData = {
    place_id: formData.get("place_id") as string,
    invoice_number: formData.get("invoice_number") as string,
    invoice_date: formData.get("invoice_date") as string,
    due_date: formData.get("due_date") as string,
    period_start: formData.get("period_start") as string,
    period_end: formData.get("period_end") as string,
    subtotal: parseFloat(formData.get("subtotal") as string),
    tax_rate: parseFloat(formData.get("tax_rate") as string) || 0,
    tax_amount: parseFloat(formData.get("tax_amount") as string) || 0,
    total: parseFloat(formData.get("total") as string),
    status: formData.get("status") as string || "draft",
    notes: formData.get("notes") as string || undefined,
    line_items: lineItems,
  };

  const validatedData = invoiceSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.errors[0].message };
  }

  // Check for duplicate invoice number (excluding current)
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("invoice_number", validatedData.data.invoice_number)
    .neq("id", id)
    .single();

  if (existingInvoice) {
    return { error: "Invoice number already exists" };
  }

  // Update invoice
  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({
      place_id: validatedData.data.place_id,
      invoice_number: validatedData.data.invoice_number,
      invoice_date: validatedData.data.invoice_date,
      due_date: validatedData.data.due_date,
      period_start: validatedData.data.period_start,
      period_end: validatedData.data.period_end,
      subtotal: validatedData.data.subtotal,
      tax_rate: validatedData.data.tax_rate,
      tax_amount: validatedData.data.tax_amount,
      total: validatedData.data.total,
      status: validatedData.data.status,
      notes: validatedData.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (invoiceError) {
    console.error("Error updating invoice:", invoiceError);
    return { error: invoiceError.message };
  }

  // Delete existing line items and recreate
  await supabase.from("invoice_line_items").delete().eq("invoice_id", id);

  if (lineItems.length > 0) {
    const { error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .insert(
        lineItems.map((item, index) => ({
          invoice_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          sort_order: index,
        }))
      );

    if (lineItemsError) {
      console.error("Error updating line items:", lineItemsError);
    }
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check invoice status - only draft invoices can be deleted
  const { data: invoice } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", id)
    .single();

  if (invoice?.status === "paid") {
    return { error: "Cannot delete a paid invoice" };
  }

  // Delete line items first
  await supabase.from("invoice_line_items").delete().eq("invoice_id", id);

  // Delete invoice
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    console.error("Error deleting invoice:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoiceStatus(id: string, status: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      status: status as "draft" | "sent" | "paid" | "partial" | "unpaid" | "overdue" | "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating invoice status:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/invoices");
  return { success: true };
}

export async function generateInvoiceNumber() {
  const supabase = await createClient();
  
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const prefix = `INV-${year}${month}-`;

  // Get the latest invoice number with this prefix
  const { data: latestInvoice } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (latestInvoice?.invoice_number) {
    const lastNumber = parseInt(latestInvoice.invoice_number.replace(prefix, ""));
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
