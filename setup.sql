-- 删除现有的触发器和函数
DROP TRIGGER IF EXISTS enforce_broker_id_requirement ON public.users;
DROP TRIGGER IF EXISTS update_users_timestamp ON public.users;
DROP TRIGGER IF EXISTS update_brokers_timestamp ON public.brokers;
DROP TRIGGER IF EXISTS update_roles_timestamp ON public.roles;
DROP FUNCTION IF EXISTS check_broker_id_requirement() CASCADE;
DROP FUNCTION IF EXISTS update_timestamp() CASCADE;

-- 按照依赖关系顺序删除表
DROP TABLE IF EXISTS "public"."users";
DROP TABLE IF EXISTS "public"."brokers";
DROP TABLE IF EXISTS "public"."roles";

-- 创建经纪公司表
CREATE TABLE IF NOT EXISTS "public"."brokers" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    website TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建角色表
CREATE TABLE IF NOT EXISTS "public"."roles" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[],
    scope TEXT NOT NULL CHECK (scope IN ('internal', 'broker')),
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS "public"."users" (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role_id UUID REFERENCES public.roles(id) NOT NULL,
    broker_id UUID REFERENCES public.brokers(id),
    phone_number TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_broker_id ON public.users(broker_id);
CREATE INDEX IF NOT EXISTS idx_brokers_name ON public.brokers(name);
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_scope ON public.roles(scope);

-- 设置 RLS 策略
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."brokers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;

-- users 表的策略
CREATE POLICY "Users can view their own data"
    ON "public"."users"
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Internal users can manage all users"
    ON "public"."users"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            INNER JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.scope = 'internal'
        )
    );

-- brokers 表的策略
CREATE POLICY "Users can view their broker"
    ON "public"."brokers"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND broker_id = brokers.id
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u
            INNER JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.scope = 'internal'
        )
    );

CREATE POLICY "Internal users can manage brokers"
    ON "public"."brokers"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            INNER JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.scope = 'internal'
        )
    );

-- roles 表的策略
CREATE POLICY "Authenticated users can view roles"
    ON "public"."roles"
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Internal users can manage roles"
    ON "public"."roles"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            INNER JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.scope = 'internal'
        )
    );

-- 创建触发器函数来验证 broker_id
CREATE OR REPLACE FUNCTION check_broker_id_requirement()
RETURNS TRIGGER AS $$
DECLARE
    role_scope TEXT;
BEGIN
    -- 获取角色的 scope
    SELECT scope INTO role_scope
    FROM public.roles
    WHERE id = NEW.role_id;

    -- 检查 broker 角色的用户必须有 broker_id
    IF role_scope = 'broker' AND NEW.broker_id IS NULL THEN
        RAISE EXCEPTION 'Broker agents must be associated with a broker';
    END IF;
    
    -- 检查内部用户不能有 broker_id
    IF role_scope = 'internal' AND NEW.broker_id IS NOT NULL THEN
        RAISE EXCEPTION 'Internal users cannot be associated with a broker';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 添加触发器
CREATE TRIGGER enforce_broker_id_requirement
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION check_broker_id_requirement();

-- 创建更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加更新时间戳触发器
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_brokers_timestamp
    BEFORE UPDATE ON public.brokers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_roles_timestamp
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 添加默认角色
INSERT INTO "public"."roles" (name, description, permissions, scope, is_custom)
VALUES
    ('superadmin', 'Super Administrator', ARRAY['manage_users', 'manage_roles', 'manage_brokers', 'manage_settings'], 'internal', false),
    ('admin', 'Internal Administrator', ARRAY['manage_users', 'manage_roles', 'manage_brokers'], 'internal', false),
    ('agent', 'Broker Agent', ARRAY['view_loans', 'create_loans'], 'broker', false)
ON CONFLICT (name) DO NOTHING; 