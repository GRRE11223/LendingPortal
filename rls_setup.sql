-- 第一步：启用 RLS
alter table public.user enable row level security;
alter table public.brokers enable row level security;

-- 第二步：删除可能存在的旧策略
drop policy if exists "Anyone can view brokers" on public.brokers;
drop policy if exists "Admin can manage brokers" on public.brokers;
drop policy if exists "Admin can update brokers" on public.brokers;
drop policy if exists "Admin can delete brokers" on public.brokers;

-- 第三步：创建新的策略

-- 允许所有认证用户查看 brokers
create policy "Anyone can view brokers"
    on public.brokers 
    for select
    to authenticated
    using (true);

-- 允许管理员添加 brokers
create policy "Admin can manage brokers"
    on public.brokers
    for insert
    to authenticated
    using (
        exists (
            select 1 from public.user
            where id = auth.uid()::text
            and role = 'Admin'
        )
    );

-- 允许管理员更新 brokers
create policy "Admin can update brokers"
    on public.brokers
    for update
    to authenticated
    using (
        exists (
            select 1 from public.user
            where id = auth.uid()::text
            and role = 'Admin'
        )
    );

-- 允许管理员删除 brokers
create policy "Admin can delete brokers"
    on public.brokers
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.user
            where id = auth.uid()::text
            and role = 'Admin'
        )
    );

-- 第四步：验证策略是否生效
select * from pg_policies where schemaname = 'public' and tablename = 'brokers'; 