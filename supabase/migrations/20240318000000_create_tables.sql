-- Create brokers table
CREATE TABLE IF NOT EXISTS public.brokers (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  website text,
  status text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create custom_roles table
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id uuid PRIMARY KEY,
  broker_id uuid REFERENCES public.brokers(id),
  name text NOT NULL,
  description text,
  permissions _text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text NOT NULL,
  name text,
  password text NOT NULL,
  role text NOT NULL,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- Create loan_requests table
CREATE TABLE IF NOT EXISTS public.loan_requests (
  id text PRIMARY KEY,
  user_id text REFERENCES public.users(id),
  borrower_name text NOT NULL,
  borrower_info jsonb,
  status text NOT NULL,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL,
  versions jsonb DEFAULT '[]'::jsonb,
  comments jsonb DEFAULT '[]'::jsonb,
  loan_request_id text REFERENCES public.loan_requests(id),
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.brokers FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.custom_roles FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.loan_requests FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.documents FOR SELECT USING (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_brokers_updated_at
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_loan_requests_updated_at
  BEFORE UPDATE ON public.loan_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 