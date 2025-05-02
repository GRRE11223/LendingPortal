-- Modify brokers table to add custom_roles column
ALTER TABLE IF EXISTS public.brokers 
ADD COLUMN IF NOT EXISTS custom_roles _text[];

-- Update the brokers table structure to match the schema
ALTER TABLE IF EXISTS public.brokers
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP; 