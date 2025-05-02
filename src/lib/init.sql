-- Enable RLS
alter table public.user enable row level security;
alter table public.brokers enable row level security;

-- Create user table if not exists
create table if not exists public.user (
    id text primary key,
    email text unique not null,
    name text,
    password text,
    role text default 'user',
    createdAt timestamp with time zone default timezone('utc'::text, now()) not null,
    updatedAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create brokers table if not exists
create table if not exists public.brokers (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    email text unique not null,
    phone text,
    address text,
    website text,
    status text default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies

-- User policies
create policy "Enable read access for authenticated users"
    on public.user for select
    to authenticated
    using (true);

create policy "Enable write access for authenticated users"
    on public.user for insert update delete
    to authenticated
    using (true);

-- Brokers policies
drop policy if exists "Enable read access for authenticated users" on public.brokers;
drop policy if exists "Enable write access for authenticated users" on public.brokers;

create policy "Anyone can view brokers"
    on public.brokers for select
    to authenticated
    using (true);

create policy "Admin can manage brokers"
    on public.brokers for insert
    to authenticated
    using (
        exists (
            select 1 from public.user
            where id = auth.uid()::text
            and role = 'Admin'
        )
    );

create policy "Admin can update brokers"
    on public.brokers for update
    to authenticated
    using (
        exists (
            select 1 from public.user
            where id = auth.uid()::text
            and role = 'Admin'
        )
    );

create policy "Admin can delete brokers"
    on public.brokers for delete
    to authenticated
    using (
        exists (
            select 1 from public.user
            where id = auth.uid()::text
            and role = 'Admin'
        )
    );

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.user (id, email, name, avatar_url)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    return new;
end;
$$;

-- Trigger for new user creation
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user(); 