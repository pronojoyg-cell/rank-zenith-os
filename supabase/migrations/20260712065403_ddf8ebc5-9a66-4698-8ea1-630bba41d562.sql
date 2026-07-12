
-- 1) Lock down SECURITY DEFINER functions from anonymous callers
REVOKE EXECUTE ON FUNCTION public.soft_delete_message_for_me(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.advance_revision(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_dm(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.soft_delete_message_for_me(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_revision(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_dm(uuid) TO authenticated;

-- 2) Chat media storage: enforce room-membership on every object operation.
-- Convention: object name is stored as '<room_id>/<...>'; first path segment is the room id.

DROP POLICY IF EXISTS "chat_media_select_members" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_insert_members" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_update_members" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_delete_members" ON storage.objects;

CREATE POLICY "chat_media_select_members"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat_media'
  AND public.is_room_member(
    NULLIF((storage.foldername(name))[1], '')::uuid,
    auth.uid()
  )
);

CREATE POLICY "chat_media_insert_members"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat_media'
  AND owner = auth.uid()
  AND public.is_room_member(
    NULLIF((storage.foldername(name))[1], '')::uuid,
    auth.uid()
  )
);

CREATE POLICY "chat_media_update_members"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat_media'
  AND owner = auth.uid()
  AND public.is_room_member(
    NULLIF((storage.foldername(name))[1], '')::uuid,
    auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'chat_media'
  AND owner = auth.uid()
  AND public.is_room_member(
    NULLIF((storage.foldername(name))[1], '')::uuid,
    auth.uid()
  )
);

CREATE POLICY "chat_media_delete_members"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat_media'
  AND owner = auth.uid()
  AND public.is_room_member(
    NULLIF((storage.foldername(name))[1], '')::uuid,
    auth.uid()
  )
);
