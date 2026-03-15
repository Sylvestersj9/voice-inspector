-- Add facility_type column to users table for SA (Supported Accommodation) support
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS facility_type text DEFAULT 'childrens_home'
    CHECK (facility_type IN ('childrens_home', 'supported_accommodation'));

-- Add comment for clarity
COMMENT ON COLUMN public.users.facility_type IS 'Type of residential facility: childrens_home (9 QS) or supported_accommodation (4 SA standards)';
