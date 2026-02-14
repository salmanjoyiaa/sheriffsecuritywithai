-- =============================================================================
-- Sheriff Security — Complete Database Schema
-- =============================================================================
-- Run this single file in Supabase SQL Editor to set up the entire database.
-- It is safe to re-run (uses IF NOT EXISTS / OR REPLACE everywhere).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Branches
CREATE TABLE IF NOT EXISTS branches (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    city        TEXT NOT NULL,
    address     TEXT NOT NULL,
    phone       TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('super_admin', 'branch_admin')),
    branch_id   UUID REFERENCES branches(id) ON DELETE SET NULL,
    full_name   TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Places (client locations)
CREATE TABLE IF NOT EXISTS places (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    address         TEXT NOT NULL,
    city            TEXT NOT NULL DEFAULT '',
    contact_person  TEXT,
    contact_phone   TEXT,
    guards_required INTEGER DEFAULT 0 NOT NULL,
    status          TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Guards
CREATE TABLE IF NOT EXISTS guards (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    full_name   TEXT,
    guard_code  TEXT NOT NULL,
    cnic        TEXT NOT NULL,
    phone       TEXT,
    address     TEXT,
    photo_url   TEXT,
    status      TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_guard_code_per_branch UNIQUE (branch_id, guard_code)
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    guard_id    UUID NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
    place_id    UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    start_date  DATE NOT NULL,
    end_date    DATE,
    shift_type  TEXT DEFAULT 'day' NOT NULL CHECK (shift_type IN ('day', 'night', 'both')),
    status      TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    guard_id        UUID NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
    place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    assignment_id   UUID REFERENCES assignments(id) ON DELETE SET NULL,
    date            DATE NOT NULL,
    shift           TEXT NOT NULL CHECK (shift IN ('day', 'night')),
    status          TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave', 'half_day')),
    check_in_time   TEXT,
    check_out_time  TEXT,
    half_day_hours  NUMERIC CHECK (half_day_hours IS NULL OR (half_day_hours >= 1 AND half_day_hours <= 11)),
    notes           TEXT,
    marked_by       UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_attendance UNIQUE (guard_id, place_id, date, shift)
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN ('Equipment', 'Safety Gear', 'Communication', 'Weapon', 'Other')),
    tracking_type   TEXT NOT NULL CHECK (tracking_type IN ('quantity', 'serialised')),
    total_quantity  INTEGER DEFAULT 0 NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Units (serialised items)
CREATE TABLE IF NOT EXISTS inventory_units (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_id         UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    serial_number   TEXT NOT NULL,
    status          TEXT DEFAULT 'available' NOT NULL CHECK (status IN ('available', 'assigned', 'maintenance')),
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_serial_per_branch UNIQUE (branch_id, serial_number)
);

-- Inventory Assignments
CREATE TABLE IF NOT EXISTS inventory_assignments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id           UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    assigned_to_type    TEXT NOT NULL CHECK (assigned_to_type IN ('place', 'guard')),
    place_id            UUID REFERENCES places(id) ON DELETE SET NULL,
    guard_id            UUID REFERENCES guards(id) ON DELETE SET NULL,
    item_id             UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    unit_id             UUID REFERENCES inventory_units(id) ON DELETE SET NULL,
    quantity            INTEGER DEFAULT 1 NOT NULL,
    assigned_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    returned_at         TIMESTAMPTZ,
    condition           TEXT,
    notes               TEXT,
    CONSTRAINT valid_assignment_target CHECK (
        (assigned_to_type = 'place' AND place_id IS NOT NULL AND guard_id IS NULL) OR
        (assigned_to_type = 'guard' AND guard_id IS NOT NULL AND place_id IS NULL)
    )
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    invoice_number  TEXT NOT NULL,
    invoice_date    DATE NOT NULL,
    due_date        DATE,
    period_start    DATE,
    period_end      DATE,
    subtotal        NUMERIC DEFAULT 0 NOT NULL,
    tax_rate        NUMERIC DEFAULT 0 NOT NULL,
    tax_amount      NUMERIC DEFAULT 0 NOT NULL,
    total           NUMERIC DEFAULT 0 NOT NULL,
    status          TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'unpaid', 'overdue', 'cancelled')),
    notes           TEXT,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_invoice_number_per_branch UNIQUE (branch_id, invoice_number)
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity    NUMERIC DEFAULT 1 NOT NULL,
    unit_price  NUMERIC DEFAULT 0 NOT NULL,
    amount      NUMERIC DEFAULT 0 NOT NULL,
    sort_order  INTEGER DEFAULT 0
);

-- Inquiries (from contact form, public)
CREATE TABLE IF NOT EXISTS inquiries (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL,
    email       TEXT,
    message     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Company Settings (single row)
CREATE TABLE IF NOT EXISTS company_settings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name        TEXT DEFAULT 'Sheriff Security Company Pvt. Ltd' NOT NULL,
    tagline             TEXT DEFAULT 'The Name of Conservation',
    address             TEXT DEFAULT 'Mohalla Nawaban Main Street Jalwana Chock',
    city                TEXT DEFAULT 'Bahawalpur',
    phone               TEXT DEFAULT '03018689990',
    phone_secondary     TEXT DEFAULT '03336644631',
    email               TEXT DEFAULT 'sheriffsgssc@gmail.com',
    website             TEXT,
    logo_url            TEXT,
    invoice_prefix      TEXT DEFAULT 'INV' NOT NULL,
    invoice_footer      TEXT DEFAULT 'Thank you for your business!',
    tax_rate            NUMERIC DEFAULT 0 NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default company settings row
INSERT INTO company_settings (id)
VALUES ('a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Service Packages (AI voice agent offerings)
CREATE TABLE IF NOT EXISTS service_packages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    category        TEXT NOT NULL CHECK (category IN ('event', 'residential', 'commercial', 'patrol', 'vip')),
    base_rate       DECIMAL(10,2) NOT NULL,
    currency        TEXT DEFAULT 'PKR',
    min_guards      INTEGER DEFAULT 1,
    max_guards      INTEGER DEFAULT 50,
    includes        TEXT[],
    available_addons TEXT[],
    image_url       TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Auto-increment sequence for request numbers
CREATE SEQUENCE IF NOT EXISTS service_request_seq START 1;

-- Service Requests (leads from AI voice agent)
CREATE TABLE IF NOT EXISTS service_requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number          TEXT UNIQUE,
    branch_id               UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_name           TEXT NOT NULL,
    customer_email          TEXT NOT NULL,
    customer_phone          TEXT,
    company_name            TEXT,
    service_type            TEXT NOT NULL CHECK (service_type IN ('event', 'residential', 'commercial', 'patrol', 'vip')),
    location_address        TEXT NOT NULL,
    location_city           TEXT,
    location_state          TEXT,
    num_guards              INTEGER DEFAULT 1,
    duration_hours          DECIMAL(6,1),
    start_date              DATE,
    start_time              TIME,
    end_date                DATE,
    special_requirements    TEXT[],
    additional_notes        TEXT,
    package_id              UUID REFERENCES service_packages(id),
    hourly_rate             DECIMAL(10,2),
    estimated_total         DECIMAL(12,2),
    currency                TEXT DEFAULT 'PKR',
    status                  TEXT DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'assigned', 'active', 'completed', 'cancelled')),
    priority                TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    source                  TEXT DEFAULT 'ai_voice' CHECK (source IN ('ai_voice', 'ai_chat', 'web_form', 'phone', 'email')),
    ai_transcript           TEXT,
    ai_confidence_score     INTEGER CHECK (ai_confidence_score IS NULL OR (ai_confidence_score >= 0 AND ai_confidence_score <= 100)),
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),
    confirmed_at            TIMESTAMPTZ,
    invoice_sent_to_customer BOOLEAN DEFAULT false,
    invoice_sent_to_owner   BOOLEAN DEFAULT false,
    invoice_sent_at         TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FUNCTIONS & TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Get current user's branch_id
CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT branch_id FROM profiles WHERE id = auth.uid();
$$;

-- Check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    );
$$;

-- Check overlapping assignments for a guard
CREATE OR REPLACE FUNCTION check_assignment_overlap(
    p_guard_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM assignments
        WHERE guard_id = p_guard_id
          AND id != COALESCE(p_exclude_id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND status = 'active'
          AND (
            (p_end_date IS NULL AND (end_date IS NULL OR end_date >= p_start_date))
            OR
            (p_end_date IS NOT NULL AND (
                (end_date IS NULL AND start_date <= p_end_date)
                OR
                (end_date IS NOT NULL AND start_date <= p_end_date AND end_date >= p_start_date)
            ))
          )
    );
END;
$$;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO profiles (id, role, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'branch_admin'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Sync guard name ↔ full_name
CREATE OR REPLACE FUNCTION sync_guard_names()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.name IS NOT NULL AND NEW.full_name IS NULL THEN
        NEW.full_name := NEW.name;
    ELSIF NEW.full_name IS NOT NULL AND NEW.name IS NULL THEN
        NEW.name := NEW.full_name;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_guard_names_trigger ON guards;
CREATE TRIGGER sync_guard_names_trigger
    BEFORE INSERT OR UPDATE ON guards
    FOR EACH ROW EXECUTE FUNCTION sync_guard_names();

-- Auto-generate request numbers like SR-2025-0001
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.request_number := 'SR-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
        LPAD(NEXTVAL('service_request_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_request_number ON public.service_requests;
CREATE TRIGGER set_request_number
    BEFORE INSERT ON public.service_requests
    FOR EACH ROW
    WHEN (NEW.request_number IS NULL)
    EXECUTE FUNCTION generate_request_number();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all tables with that column
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = 'public'
          AND table_name NOT IN ('inventory_assignments')
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE branches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE places                ENABLE ROW LEVEL SECURITY;
ALTER TABLE guards                ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_units       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests      ENABLE ROW LEVEL SECURITY;

-- Branches
CREATE POLICY "super_admin_branches_all" ON branches FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_branches_select" ON branches FOR SELECT TO authenticated
    USING (NOT is_super_admin() AND id = get_user_branch_id());

-- Profiles
CREATE POLICY "super_admin_profiles_all" ON profiles FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT TO authenticated
    USING (id = auth.uid());
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Places
CREATE POLICY "super_admin_places_all" ON places FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_places_all" ON places FOR ALL TO authenticated
    USING (NOT is_super_admin() AND branch_id = get_user_branch_id())
    WITH CHECK (NOT is_super_admin() AND branch_id = get_user_branch_id());

-- Guards
CREATE POLICY "super_admin_guards_all" ON guards FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_guards_all" ON guards FOR ALL TO authenticated
    USING (NOT is_super_admin() AND branch_id = get_user_branch_id())
    WITH CHECK (NOT is_super_admin() AND branch_id = get_user_branch_id());

-- Assignments
CREATE POLICY "super_admin_assignments_all" ON assignments FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_assignments_all" ON assignments FOR ALL TO authenticated
    USING (NOT is_super_admin() AND branch_id = get_user_branch_id())
    WITH CHECK (NOT is_super_admin() AND branch_id = get_user_branch_id());

-- Attendance
CREATE POLICY "super_admin_attendance_all" ON attendance FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_attendance_all" ON attendance FOR ALL TO authenticated
    USING (NOT is_super_admin() AND branch_id = get_user_branch_id())
    WITH CHECK (NOT is_super_admin() AND branch_id = get_user_branch_id());

-- Inventory Items
CREATE POLICY "super_admin_inventory_items_all" ON inventory_items FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_inventory_items_all" ON inventory_items FOR ALL TO authenticated
    USING (NOT is_super_admin() AND branch_id = get_user_branch_id())
    WITH CHECK (NOT is_super_admin() AND branch_id = get_user_branch_id());

-- Inventory Units
CREATE POLICY "super_admin_inventory_units_all" ON inventory_units FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_inventory_units_all" ON inventory_units FOR ALL TO authenticated
    USING (NOT is_super_admin() AND branch_id = get_user_branch_id())
    WITH CHECK (NOT is_super_admin() AND branch_id = get_user_branch_id());

-- Inventory Assignments
CREATE POLICY "super_admin_inventory_assignments_all" ON inventory_assignments FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_inventory_assignments_all" ON inventory_assignments FOR ALL TO authenticated
    USING (NOT is_super_admin() AND branch_id = get_user_branch_id())
    WITH CHECK (NOT is_super_admin() AND branch_id = get_user_branch_id());

-- Invoices
CREATE POLICY "super_admin_invoices_all" ON invoices FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_invoices_all" ON invoices FOR ALL TO authenticated
    USING (NOT is_super_admin() AND branch_id = get_user_branch_id())
    WITH CHECK (NOT is_super_admin() AND branch_id = get_user_branch_id());

-- Invoice Line Items
CREATE POLICY "super_admin_invoice_line_items_all" ON invoice_line_items FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "branch_admin_invoice_line_items_all" ON invoice_line_items FOR ALL TO authenticated
    USING (
        NOT is_super_admin()
        AND EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_line_items.invoice_id
              AND invoices.branch_id = get_user_branch_id()
        )
    )
    WITH CHECK (
        NOT is_super_admin()
        AND EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_line_items.invoice_id
              AND invoices.branch_id = get_user_branch_id()
        )
    );

-- Inquiries (public can insert, authenticated can read)
CREATE POLICY "public_insert_inquiries" ON inquiries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated_read_inquiries" ON inquiries FOR SELECT TO authenticated USING (true);
CREATE POLICY "super_admin_delete_inquiries" ON inquiries FOR DELETE TO authenticated USING (is_super_admin());

-- Company Settings
CREATE POLICY "public_read_company_settings" ON company_settings FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_read_company_settings" ON company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "super_admin_update_company_settings" ON company_settings FOR UPDATE TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Service Packages (public can view active packages)
CREATE POLICY "anyone_view_active_packages" ON service_packages FOR SELECT USING (is_active = true);
CREATE POLICY "super_admin_manage_packages" ON service_packages FOR ALL TO authenticated
    USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Service Requests (public inserts, authenticated manages)
CREATE POLICY "anyone_create_service_requests" ON service_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "authenticated_view_requests" ON service_requests FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_update_requests" ON service_requests FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_delete_requests" ON service_requests FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_branch       ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_places_branch          ON places(branch_id);
CREATE INDEX IF NOT EXISTS idx_guards_branch          ON guards(branch_id);
CREATE INDEX IF NOT EXISTS idx_assignments_branch     ON assignments(branch_id);
CREATE INDEX IF NOT EXISTS idx_assignments_guard      ON assignments(guard_id);
CREATE INDEX IF NOT EXISTS idx_assignments_place      ON assignments(place_id);
CREATE INDEX IF NOT EXISTS idx_attendance_branch      ON attendance(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_guard       ON attendance(guard_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date        ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_branch ON inventory_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_branch        ON invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status        ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_branch ON service_requests(branch_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE! Schema is ready.
-- Next: Create a user in Supabase Auth, then run the make_super_admin query.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT '✅ Sheriff Security schema installed successfully!' AS status;
