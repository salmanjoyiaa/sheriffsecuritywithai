-- =============================================================================
-- Sheriff Security — Seed Data (Optional)
-- =============================================================================
-- Run this AFTER 00_complete_schema.sql to populate sample data.
-- =============================================================================

-- Sample Branches
INSERT INTO branches (id, name, city, address, phone) VALUES
('10000000-0000-0000-0000-000000000001', 'Bahawalpur Head Office', 'Bahawalpur',
 'Mohalla Nawaban Main Street Jalwana Chock, Bahawalpur 63100', '03018689990'),
('10000000-0000-0000-0000-000000000002', 'Multan Branch', 'Multan',
 'Gulgasht Colony Main Boulevard, Multan 60000', '03336644631')
ON CONFLICT (id) DO NOTHING;

-- Sample Places
INSERT INTO places (id, branch_id, name, address, city, contact_person, contact_phone, guards_required, status) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 'Allied Bank Main Branch', 'Circular Road, Bahawalpur', 'Bahawalpur', 'Mr. Ahmed Khan', '03001234567', 4, 'active'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
 'Metro Cash & Carry', 'Ahmadpur Road, Bahawalpur', 'Bahawalpur', 'Mr. Naveed Hussain', '03007654321', 6, 'active'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
 'Nishtar Medical Hospital', 'Nishtar Road, Multan', 'Multan', 'Dr. Imran Ali', '03111234567', 8, 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample Guards
INSERT INTO guards (id, branch_id, name, guard_code, cnic, phone, status) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 'Muhammad Aslam', 'BWP-001', '31101-1234567-1', '03001111111', 'active'),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
 'Ghulam Mustafa', 'BWP-002', '31101-2234567-2', '03002222222', 'active'),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
 'Arshad Ali', 'MLT-001', '36101-1234567-1', '03111111111', 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample Assignments
INSERT INTO assignments (id, branch_id, guard_id, place_id, start_date, shift_type, status, notes) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 CURRENT_DATE - INTERVAL '30 days', 'day', 'active', 'Main gate duty'),
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 CURRENT_DATE - INTERVAL '30 days', 'night', 'active', 'Night patrol')
ON CONFLICT (id) DO NOTHING;

-- Seed Service Packages
INSERT INTO service_packages (name, description, category, base_rate, currency, includes, available_addons) VALUES
('Event Security',       'Professional security for events, weddings, concerts, and gatherings',      'event',       500.00,  'PKR', '{"uniformed guards","radio comms","crowd management","incident reports"}', '{"armed","k9","metal detectors"}'),
('Residential Patrol',   'Round-the-clock patrolling for residential areas and housing societies',     'residential', 400.00,  'PKR', '{"uniformed guards","hourly patrols","incident reports","emergency response"}', '{"armed","cctv monitoring","vehicle patrol"}'),
('Commercial Protection','Complete security solutions for offices, banks, and commercial properties',  'commercial',  600.00,  'PKR', '{"uniformed guards","access control","CCTV monitoring","incident reports"}', '{"armed","k9","vehicle patrol","24/7 dispatch"}'),
('VIP Protection',       'Close protection and executive security for high-profile individuals',       'vip',         1000.00, 'PKR', '{"close protection officers","advance planning","secure transport","threat assessment"}', '{"armed","counter-surveillance","medical trained"}'),
('Construction Site',    'Security for construction sites, warehouses, and industrial areas',           'patrol',      450.00,  'PKR', '{"uniformed guards","perimeter patrol","access logs","theft prevention"}', '{"armed","k9","drone surveillance","cctv"}')
ON CONFLICT DO NOTHING;

SELECT '✅ Seed data inserted!' AS status;
