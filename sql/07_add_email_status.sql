-- Add email_status column to service_requests for tracking email delivery
-- Run this in the Supabase SQL editor

ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT NULL
CHECK (email_status IN ('sending', 'sent', 'failed'));

COMMENT ON COLUMN service_requests.email_status IS 'Tracks confirmation email delivery status: sending, sent, or failed';
