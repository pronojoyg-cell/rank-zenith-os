
-- Roles / tier / credits on profiles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.tier_t AS ENUM ('free', 'monthly', 'elite');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS current_tier public.tier_t NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS ai_credits integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- has_role SECURITY DEFINER (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'admin');
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- Allow admins to read & update all profiles
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- user_analytics
CREATE TABLE IF NOT EXISTS public.user_analytics (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_cbts_generated integer NOT NULL DEFAULT 0,
  deep_work_minutes integer NOT NULL DEFAULT 0,
  total_mistakes_logged integer NOT NULL DEFAULT 0,
  peak_usage_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  active_devices integer NOT NULL DEFAULT 1,
  credits_burned integer NOT NULL DEFAULT 0,
  revenue_cents integer NOT NULL DEFAULT 0,
  cost_cents integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_analytics TO authenticated;
GRANT ALL ON public.user_analytics TO service_role;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own analytics" ON public.user_analytics
  FOR SELECT TO authenticated USING (auth.uid() = profile_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins write analytics" ON public.user_analytics
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- complaints
CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create own complaints" ON public.complaints
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users read own complaints" ON public.complaints
  FOR SELECT TO authenticated USING (auth.uid() = profile_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins update complaints" ON public.complaints
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ai_error_flags
CREATE TABLE IF NOT EXISTS public.ai_error_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cbt_id uuid,
  question_id uuid,
  reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_feedback text NOT NULL,
  corrected_answer text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ai_error_flags TO authenticated;
GRANT ALL ON public.ai_error_flags TO service_role;
ALTER TABLE public.ai_error_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create flags" ON public.ai_error_flags
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Users read own flags" ON public.ai_error_flags
  FOR SELECT TO authenticated USING (auth.uid() = reported_by OR public.is_admin(auth.uid()));
CREATE POLICY "Admins update flags" ON public.ai_error_flags
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- admin_secrets: server-only, no direct table access
CREATE TABLE IF NOT EXISTS public.admin_secrets (
  id integer PRIMARY KEY DEFAULT 1,
  passcode_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.admin_secrets TO service_role;
-- No grants to authenticated/anon: only accessible via SECURITY DEFINER RPC

-- Seed default passcode = "737737" (SHA-256). Change via SQL after login.
INSERT INTO public.admin_secrets (id, passcode_hash)
VALUES (1, encode(digest('737737', 'sha256'), 'hex'))
ON CONFLICT (id) DO NOTHING;

-- security_breach_log
CREATE TABLE IF NOT EXISTS public.security_breach_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  reason text NOT NULL,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.security_breach_log TO authenticated;
GRANT ALL ON public.security_breach_log TO service_role;
ALTER TABLE public.security_breach_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any auth insert breach log" ON public.security_breach_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins read breach log" ON public.security_breach_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- verify_admin_passcode RPC
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(input_passcode text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _stored text;
  _match boolean;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF NOT public.is_admin(_uid) THEN
    INSERT INTO public.security_breach_log(user_id, reason) VALUES (_uid, 'non-admin passcode attempt');
    RETURN false;
  END IF;
  SELECT passcode_hash INTO _stored FROM public.admin_secrets WHERE id = 1;
  _match := (_stored = encode(digest(coalesce(input_passcode,''), 'sha256'), 'hex'));
  IF NOT _match THEN
    INSERT INTO public.security_breach_log(user_id, reason) VALUES (_uid, 'wrong admin passcode');
  END IF;
  RETURN _match;
END $$;
REVOKE EXECUTE ON FUNCTION public.verify_admin_passcode(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_passcode(text) TO authenticated;
