-- 检查当前用户的认证状态
select 
    auth.uid() as current_user_id,
    (select role from public.user where id = auth.uid()::text) as user_role;

-- 检查 RLS 是否启用
select 
    tablename,
    rowsecurity
from pg_tables 
where schemaname = 'public' 
and tablename in ('user', 'brokers');

-- 检查现有的策略
select 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
from pg_policies 
where schemaname = 'public' 
and tablename = 'brokers'; 