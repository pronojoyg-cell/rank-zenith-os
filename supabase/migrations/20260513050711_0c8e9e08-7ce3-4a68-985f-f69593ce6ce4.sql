
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.advance_revision(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advance_revision(uuid, int) TO authenticated;
