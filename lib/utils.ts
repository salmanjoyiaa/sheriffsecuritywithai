import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateInvoiceNumber(
  branchCode: string,
  year: number,
  month: number,
  sequence: number
): string {
  const monthStr = month.toString().padStart(2, "0");
  const seqStr = sequence.toString().padStart(4, "0");
  return `INV-${branchCode}-${year}-${monthStr}${seqStr}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const SHIFT_TYPES = ["day", "night", "both"] as const;
export type ShiftType = (typeof SHIFT_TYPES)[number];

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "leave",
  "half_day",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const INVENTORY_CATEGORIES = [
  "Equipment",
  "Safety Gear",
  "Communication",
  "Weapon",
  "Other",
] as const;
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "partial",
  "unpaid",
  "overdue",
  "cancelled",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const USER_ROLES = ["super_admin", "branch_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const GUARD_STATUSES = ["active", "inactive"] as const;
export type GuardStatus = (typeof GUARD_STATUSES)[number];

export const UNIT_STATUSES = ["available", "assigned", "maintenance"] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];
