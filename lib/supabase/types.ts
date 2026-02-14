export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          name: string;
          city: string;
          address: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          address: string;
          phone: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          address?: string;
          phone?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: "super_admin" | "branch_admin";
          branch_id: string | null;
          full_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          role: "super_admin" | "branch_admin";
          branch_id?: string | null;
          full_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: "super_admin" | "branch_admin";
          branch_id?: string | null;
          full_name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
      places: {
        Row: {
          id: string;
          branch_id: string;
          name: string;
          address: string;
          city: string;
          contact_person: string | null;
          contact_phone: string | null;
          guards_required: number;
          status: "active" | "inactive";
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name: string;
          address: string;
          city?: string;
          contact_person?: string | null;
          contact_phone?: string | null;
          guards_required?: number;
          status?: "active" | "inactive";
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          branch_id?: string;
          name?: string;
          address?: string;
          city?: string;
          contact_person?: string | null;
          contact_phone?: string | null;
          guards_required?: number;
          status?: "active" | "inactive";
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "places_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
      guards: {
        Row: {
          id: string;
          branch_id: string;
          name: string;
          full_name: string | null;
          guard_code: string;
          cnic: string;
          phone: string | null;
          address: string | null;
          photo_url: string | null;
          status: "active" | "inactive";
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name: string;
          full_name?: string | null;
          guard_code: string;
          cnic: string;
          phone?: string | null;
          address?: string | null;
          photo_url?: string | null;
          status?: "active" | "inactive";
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          branch_id?: string;
          name?: string;
          full_name?: string | null;
          guard_code?: string;
          cnic?: string;
          phone?: string | null;
          address?: string | null;
          photo_url?: string | null;
          status?: "active" | "inactive";
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guards_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
      assignments: {
        Row: {
          id: string;
          branch_id: string;
          guard_id: string;
          place_id: string;
          start_date: string;
          end_date: string | null;
          shift_type: "day" | "night" | "both";
          status: "active" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          guard_id: string;
          place_id: string;
          start_date: string;
          end_date?: string | null;
          shift_type?: "day" | "night" | "both";
          status?: "active" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          branch_id?: string;
          guard_id?: string;
          place_id?: string;
          start_date?: string;
          end_date?: string | null;
          shift_type?: "day" | "night" | "both";
          status?: "active" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_guard_id_fkey";
            columns: ["guard_id"];
            referencedRelation: "guards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_place_id_fkey";
            columns: ["place_id"];
            referencedRelation: "places";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance: {
        Row: {
          id: string;
          branch_id: string;
          guard_id: string;
          place_id: string;
          assignment_id: string | null;
          date: string;
          shift: "day" | "night";
          status: "present" | "absent" | "leave" | "half_day" | "late";
          check_in_time: string | null;
          check_out_time: string | null;
          half_day_hours: number | null;
          notes: string | null;
          marked_by: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          guard_id: string;
          place_id: string;
          assignment_id?: string | null;
          date: string;
          shift: "day" | "night";
          status: "present" | "absent" | "leave" | "half_day" | "late";
          check_in_time?: string | null;
          check_out_time?: string | null;
          half_day_hours?: number | null;
          notes?: string | null;
          marked_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          branch_id?: string;
          guard_id?: string;
          place_id?: string;
          assignment_id?: string | null;
          date?: string;
          shift?: "day" | "night";
          status?: "present" | "absent" | "leave" | "half_day" | "late";
          check_in_time?: string | null;
          check_out_time?: string | null;
          half_day_hours?: number | null;
          notes?: string | null;
          marked_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_guard_id_fkey";
            columns: ["guard_id"];
            referencedRelation: "guards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_place_id_fkey";
            columns: ["place_id"];
            referencedRelation: "places";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_items: {
        Row: {
          id: string;
          branch_id: string;
          name: string;
          category: string;
          tracking_type: "quantity" | "serialised";
          total_quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name: string;
          category: string;
          tracking_type: "quantity" | "serialised";
          total_quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          name?: string;
          category?: string;
          tracking_type?: "quantity" | "serialised";
          total_quantity?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_units: {
        Row: {
          id: string;
          branch_id: string;
          item_id: string;
          serial_number: string;
          status: "available" | "assigned" | "maintenance";
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          item_id: string;
          serial_number: string;
          status?: "available" | "assigned" | "maintenance";
          created_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          item_id?: string;
          serial_number?: string;
          status?: "available" | "assigned" | "maintenance";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_units_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_units_item_id_fkey";
            columns: ["item_id"];
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_assignments: {
        Row: {
          id: string;
          branch_id: string;
          assigned_to_type: "place" | "guard";
          place_id: string | null;
          guard_id: string | null;
          item_id: string;
          unit_id: string | null;
          quantity: number;
          assigned_at: string;
          returned_at: string | null;
          condition: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          assigned_to_type: "place" | "guard";
          place_id?: string | null;
          guard_id?: string | null;
          item_id: string;
          unit_id?: string | null;
          quantity?: number;
          assigned_at?: string;
          returned_at?: string | null;
          condition?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          branch_id?: string;
          assigned_to_type?: "place" | "guard";
          place_id?: string | null;
          guard_id?: string | null;
          item_id?: string;
          unit_id?: string | null;
          quantity?: number;
          assigned_at?: string;
          returned_at?: string | null;
          condition?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_assignments_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_assignments_guard_id_fkey";
            columns: ["guard_id"];
            referencedRelation: "guards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_assignments_item_id_fkey";
            columns: ["item_id"];
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_assignments_place_id_fkey";
            columns: ["place_id"];
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_assignments_unit_id_fkey";
            columns: ["unit_id"];
            referencedRelation: "inventory_units";
            referencedColumns: ["id"];
          }
        ];
      };
      invoices: {
        Row: {
          id: string;
          branch_id: string;
          place_id: string;
          invoice_number: string;
          invoice_date: string;
          due_date: string | null;
          period_start: string | null;
          period_end: string | null;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          total_amount: number | null;
          status: "draft" | "sent" | "paid" | "partial" | "unpaid" | "overdue" | "cancelled";
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          place_id: string;
          invoice_number: string;
          invoice_date: string;
          due_date?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          status?: "draft" | "sent" | "paid" | "partial" | "unpaid" | "overdue" | "cancelled";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          branch_id?: string;
          place_id?: string;
          invoice_number?: string;
          invoice_date?: string;
          due_date?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          status?: "draft" | "sent" | "paid" | "partial" | "unpaid" | "overdue" | "cancelled";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_place_id_fkey";
            columns: ["place_id"];
            referencedRelation: "places";
            referencedColumns: ["id"];
          }
        ];
      };
      invoice_line_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          line_total: number | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey";
            columns: ["invoice_id"];
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          }
        ];
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      company_settings: {
        Row: {
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
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_name?: string;
          tagline?: string | null;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          phone_secondary?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          invoice_prefix?: string;
          invoice_footer?: string | null;
          tax_rate?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_name?: string;
          tagline?: string | null;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          phone_secondary?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          invoice_prefix?: string;
          invoice_footer?: string | null;
          tax_rate?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      service_packages: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: "event" | "residential" | "commercial" | "patrol" | "vip";
          base_rate: number;
          currency: string;
          min_guards: number;
          max_guards: number;
          includes: string[] | null;
          available_addons: string[] | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: "event" | "residential" | "commercial" | "patrol" | "vip";
          base_rate: number;
          currency?: string;
          min_guards?: number;
          max_guards?: number;
          includes?: string[] | null;
          available_addons?: string[] | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: "event" | "residential" | "commercial" | "patrol" | "vip";
          base_rate?: number;
          currency?: string;
          min_guards?: number;
          max_guards?: number;
          includes?: string[] | null;
          available_addons?: string[] | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      service_requests: {
        Row: {
          id: string;
          request_number: string | null;
          branch_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          company_name: string | null;
          service_type: "event" | "residential" | "commercial" | "patrol" | "vip";
          location_address: string;
          location_city: string | null;
          location_state: string | null;
          num_guards: number;
          duration_hours: number | null;
          start_date: string | null;
          start_time: string | null;
          end_date: string | null;
          special_requirements: string[] | null;
          additional_notes: string | null;
          package_id: string | null;
          hourly_rate: number | null;
          estimated_total: number | null;
          currency: string;
          status: "new" | "confirmed" | "assigned" | "active" | "completed" | "cancelled";
          priority: "low" | "normal" | "high" | "urgent";
          source: "ai_voice" | "ai_chat" | "web_form" | "phone" | "email";
          ai_transcript: string | null;
          ai_confidence_score: number | null;
          created_at: string;
          updated_at: string;
          confirmed_at: string | null;
          invoice_sent_to_customer: boolean;
          invoice_sent_to_owner: boolean;
          invoice_sent_at: string | null;
        };
        Insert: {
          id?: string;
          request_number?: string | null;
          branch_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          company_name?: string | null;
          service_type: "event" | "residential" | "commercial" | "patrol" | "vip";
          location_address: string;
          location_city?: string | null;
          location_state?: string | null;
          num_guards?: number;
          duration_hours?: number | null;
          start_date?: string | null;
          start_time?: string | null;
          end_date?: string | null;
          special_requirements?: string[] | null;
          additional_notes?: string | null;
          package_id?: string | null;
          hourly_rate?: number | null;
          estimated_total?: number | null;
          currency?: string;
          status?: "new" | "confirmed" | "assigned" | "active" | "completed" | "cancelled";
          priority?: "low" | "normal" | "high" | "urgent";
          source?: "ai_voice" | "ai_chat" | "web_form" | "phone" | "email";
          ai_transcript?: string | null;
          ai_confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          invoice_sent_to_customer?: boolean;
          invoice_sent_to_owner?: boolean;
          invoice_sent_at?: string | null;
        };
        Update: {
          id?: string;
          request_number?: string | null;
          branch_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          company_name?: string | null;
          service_type?: "event" | "residential" | "commercial" | "patrol" | "vip";
          location_address?: string;
          location_city?: string | null;
          location_state?: string | null;
          num_guards?: number;
          duration_hours?: number | null;
          start_date?: string | null;
          start_time?: string | null;
          end_date?: string | null;
          special_requirements?: string[] | null;
          additional_notes?: string | null;
          package_id?: string | null;
          hourly_rate?: number | null;
          estimated_total?: number | null;
          currency?: string;
          status?: "new" | "confirmed" | "assigned" | "active" | "completed" | "cancelled";
          priority?: "low" | "normal" | "high" | "urgent";
          source?: "ai_voice" | "ai_chat" | "web_form" | "phone" | "email";
          ai_transcript?: string | null;
          ai_confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          invoice_sent_to_customer?: boolean;
          invoice_sent_to_owner?: boolean;
          invoice_sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "service_requests_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_requests_package_id_fkey";
            columns: ["package_id"];
            referencedRelation: "service_packages";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_branch_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      check_assignment_overlap: {
        Args: {
          p_guard_id: string;
          p_start_date: string;
          p_end_date: string | null;
          p_exclude_id: string | null;
        };
        Returns: boolean;
      };
      has_active_assignment: {
        Args: {
          p_guard_id: string;
          p_place_id: string;
          p_date: string;
          p_shift: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience types
export type Branch = Tables<"branches">;
export type Profile = Tables<"profiles">;
export type Place = Tables<"places">;
export type Guard = Tables<"guards">;
export type Assignment = Tables<"assignments">;
export type Attendance = Tables<"attendance">;
export type InventoryItem = Tables<"inventory_items">;
export type InventoryUnit = Tables<"inventory_units">;
export type InventoryAssignment = Tables<"inventory_assignments">;
export type Invoice = Tables<"invoices">;
export type InvoiceLineItem = Tables<"invoice_line_items">;
export type Inquiry = Tables<"inquiries">;
export type CompanySettings = Tables<"company_settings">;
export type ServicePackage = Tables<"service_packages">;
export type ServiceRequest = Tables<"service_requests">;

// Extended types with relations
export type AssignmentWithRelations = Assignment & {
  guard: Guard;
  place: Place;
  branch: Branch;
};

export type AttendanceWithRelations = Attendance & {
  guard: Guard;
  place: Place;
};

export type InvoiceWithRelations = Invoice & {
  place: Place;
  branch: Branch;
  line_items: InvoiceLineItem[];
};

export type InventoryAssignmentWithRelations = InventoryAssignment & {
  item: InventoryItem;
  unit: InventoryUnit | null;
  place: Place | null;
  guard: Guard | null;
};

export type ProfileWithBranch = Profile & {
  branch: Branch | null;
};
