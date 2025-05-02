-- 检查当前用户ID
SELECT auth.uid() as current_user_id;

-- 检查 auth.users 表中的记录
SELECT * FROM auth.users WHERE id = auth.uid();

-- 检查 public.users 表中的记录
SELECT u.*, r.name as role_name, r.permissions 
FROM public.users u 
LEFT JOIN public.roles r ON u.role_id = r.id 
WHERE u.id = auth.uid();

-- 将当前用户设置为管理员（如果需要）
INSERT INTO public.users (id, email, is_admin, status)
SELECT id, email, true, 'active'
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (id) 
DO UPDATE SET is_admin = true, status = 'active'; 