"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { inquirySchema, type InquiryFormData } from "@/lib/validations";

export async function submitInquiry(data: InquiryFormData) {
  try {
    // Validate input
    const validated = inquirySchema.parse(data);

    // Use admin client to bypass RLS for public form
    const supabase = createAdminClient();

    const { error } = await supabase.from("inquiries").insert({
      name: validated.name,
      phone: validated.phone,
      email: validated.email || null,
      message: validated.message,
    });

    if (error) {
      console.error("Error submitting inquiry:", error);
      return { success: false, error: "Failed to submit inquiry" };
    }

    return { success: true };
  } catch (error) {
    console.error("Inquiry submission error:", error);
    return { success: false, error: "Invalid form data" };
  }
}
