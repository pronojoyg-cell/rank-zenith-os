-- Extend messages table for media uploads
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','video','file'));

-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_media', 'chat_media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to chat_media
CREATE POLICY "chat_media_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat_media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "chat_media_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat_media');

CREATE POLICY "chat_media_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat_media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create a new group chat room function
CREATE OR REPLACE FUNCTION public.create_group(_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _me uuid := auth.uid();
  _room uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.chat_rooms (is_group, name, created_by) VALUES (true, _name, _me) RETURNING id INTO _room;
  INSERT INTO public.room_members (room_id, user_id) VALUES (_room, _me);
  RETURN _room;
END $$;

-- Create a new community
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS com_select ON public.communities FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS com_insert ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY IF NOT EXISTS com_update ON public.communities FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY IF NOT EXISTS com_delete ON public.communities FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS cm_select ON public.community_members FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS cm_insert ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS cm_delete ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  media_url text,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS cp_select ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS cp_insert ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS cp_delete ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Realtime
ALTER TABLE public.communities REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
