DROP POLICY IF EXISTS "anyone can submit feedback" ON public.feedback;

CREATE POLICY "anyone can submit feedback"
  ON public.feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(message) BETWEEN 1 AND 4000
    AND length(coalesce(email,'')) <= 320
    AND length(coalesce(page,'')) <= 200
    AND category IN ('recommendation','bug','question','other')
  );