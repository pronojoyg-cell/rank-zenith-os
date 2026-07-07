
-- connections: prevent sender from self-accepting.
DROP POLICY IF EXISTS conn_update ON public.connections;
CREATE POLICY conn_update_receiver ON public.connections
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
CREATE POLICY conn_update_sender ON public.connections
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id AND status <> 'accepted');

-- messages: SECURITY DEFINER RPC for per-user soft delete by any room member
CREATE OR REPLACE FUNCTION public.soft_delete_message_for_me(_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _room uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT room_id INTO _room FROM public.messages WHERE id = _message_id;
  IF _room IS NULL THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF NOT public.is_room_member(_room, _me) THEN RAISE EXCEPTION 'Not a room member'; END IF;
  UPDATE public.messages
    SET deleted_by_users =
      (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(deleted_by_users, ARRAY[]::uuid[]) || ARRAY[_me])))
    WHERE id = _message_id;
END $$;

REVOKE ALL ON FUNCTION public.soft_delete_message_for_me(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_message_for_me(uuid) TO authenticated;
