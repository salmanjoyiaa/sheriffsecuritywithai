import { z } from "zod";

// Common validations
export const phoneRegex = /^(03[0-9]{9}|0[1-9][0-9]{9,10})$/;
// CNIC can be with dashes (12345-1234567-1) or without (1234512345671)
export const cnicRegex = /^([0-9]{5}-[0-9]{7}-[0-9]|[0-9]{13})$/;

// Branch Schema
export const branchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters"),
  city: z.string().min(2, "City is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().regex(phoneRegex, "Invalid phone number format"),
});
export type BranchFormData = z.infer<typeof branchSchema>;

// Place Schema
export const placeSchema = z.object({
  branch_id: z.string().uuid("Invalid branch"),
  name: z.string().min(2, "Place name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional(),
});
export type PlaceFormData = z.infer<typeof placeSchema>;

// Guard Schema
export const guardSchema = z.object({
  branch_id: z.string().uuid("Invalid branch"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  guard_code: z.string().min(2, "Guard code is required"),
  cnic: z.string().regex(cnicRegex, "CNIC must be 13 digits (with or without dashes)"),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional(),
});
export type GuardFormData = z.infer<typeof guardSchema>;

// Assignment Schema
export const assignmentSchema = z
  .object({
    branch_id: z.string().uuid("Invalid branch"),
    guard_id: z.string().uuid("Select a guard"),
    place_id: z.string().uuid("Select a place"),
    start_date: z.coerce.date({ required_error: "Start date is required" }),
    end_date: z.coerce.date().nullable().optional(),
    shift_type: z.enum(["day", "night", "both"]).default("day"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.end_date) {
        return data.end_date >= data.start_date;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["end_date"],
    }
  );
export type AssignmentFormData = z.infer<typeof assignmentSchema>;

// Attendance Schema
export const attendanceSchema = z
  .object({
    branch_id: z.string().uuid("Invalid branch").optional(),
    assignment_id: z.string().uuid().optional(),
    date: z.string(),
    place_id: z.string().uuid("Select a place").optional(),
    guard_id: z.string().uuid("Select a guard").optional(),
    shift: z.enum(["day", "night"]),
    status: z.enum(["present", "absent", "leave", "half_day", "late"]),
    check_in_time: z.string().optional(),
    check_out_time: z.string().optional(),
    half_day_hours: z.coerce.number().min(1).max(11).nullable().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "half_day") {
        return data.half_day_hours && data.half_day_hours > 0;
      }
      return true;
    },
    {
      message: "Half day hours required when status is half_day",
      path: ["half_day_hours"],
    }
  );
export type AttendanceFormData = z.infer<typeof attendanceSchema>;

// Bulk Attendance Schema
export const bulkAttendanceSchema = z.object({
  date: z.string(),
  shift: z.enum(["day", "night"]),
  place_id: z.string().uuid("Select a place"),
  attendance: z.array(
    z.object({
      assignment_id: z.string().uuid(),
      status: z.enum(["present", "absent", "leave", "half_day", "late"]),
      notes: z.string().optional(),
    })
  ),
});
export type BulkAttendanceFormData = z.infer<typeof bulkAttendanceSchema>;

// Inventory Item Schema
export const inventoryItemSchema = z.object({
  branch_id: z.string().uuid("Invalid branch"),
  name: z.string().min(2, "Item name is required"),
  category: z.enum([
    "Equipment",
    "Safety Gear",
    "Communication",
    "Weapon",
    "Other",
  ]),
  tracking_type: z.enum(["quantity", "serialised"]),
  total_quantity: z.coerce.number().int().min(0).default(0),
});
export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

// Inventory Unit Schema
export const inventoryUnitSchema = z.object({
  branch_id: z.string().uuid("Invalid branch"),
  item_id: z.string().uuid("Select an item"),
  serial_number: z.string().min(2, "Serial number is required"),
  status: z.enum(["available", "assigned", "maintenance"]).default("available"),
});
export type InventoryUnitFormData = z.infer<typeof inventoryUnitSchema>;

// Inventory Assignment Schema
export const inventoryAssignmentSchema = z.object({
  branch_id: z.string().uuid("Invalid branch"),
  assigned_to_type: z.enum(["place", "guard"]),
  place_id: z.string().uuid().nullable().optional(),
  guard_id: z.string().uuid().nullable().optional(),
  item_id: z.string().uuid().nullable().optional(),
  unit_id: z.string().uuid().nullable().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  condition: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.item_id || data.unit_id,
  { message: "Either item or unit must be selected" }
).refine(
  (data) => data.place_id || data.guard_id,
  { message: "Either place or guard must be selected" }
);
export type InventoryAssignmentFormData = z.infer<
  typeof inventoryAssignmentSchema
>;

// Invoice Schema
export const invoiceSchema = z.object({
  branch_id: z.string().uuid("Invalid branch").optional(),
  place_id: z.string().uuid("Select a place"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  invoice_date: z.string(),
  due_date: z.string().optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  subtotal: z.coerce.number().min(0).default(0),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  tax_amount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0).default(0),
  status: z.enum(["draft", "sent", "paid", "partial", "unpaid", "overdue", "cancelled"]).default("draft"),
  notes: z.string().optional(),
  line_items: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.coerce.number().min(0.01, "Quantity must be positive"),
      unit_price: z.coerce.number().min(0, "Unit price must be 0 or more"),
      amount: z.coerce.number().min(0).default(0),
    })
  ),
});
export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Inquiry Schema (Contact Form)
export const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(phoneRegex, "Invalid phone number format"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
export type InquiryFormData = z.infer<typeof inquirySchema>;

// Company Settings Schema
export const companySettingsSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  phones: z.string().min(10, "At least one phone number is required"),
  email: z.string().email("Invalid email"),
  hq_address: z.string().min(5, "Address is required"),
});
export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// Report Filters
export const guardAttendanceReportSchema = z.object({
  place_id: z.string().uuid("Select a place"),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  shift: z.enum(["day", "night", "all"]).default("all"),
});
export type GuardAttendanceReportFormData = z.infer<
  typeof guardAttendanceReportSchema
>;

export const placeReportSchema = z.object({
  place_id: z.string().uuid("Select a place"),
  start_date: z.coerce.date({ required_error: "Start date is required" }),
  end_date: z.coerce.date({ required_error: "End date is required" }),
});
export type PlaceReportFormData = z.infer<typeof placeReportSchema>;

// General Reports Schema
export const reportsSchema = z.object({
  report_type: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  guard_id: z.string().uuid().optional(),
  place_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
});
export type ReportsFormData = z.infer<typeof reportsSchema>;