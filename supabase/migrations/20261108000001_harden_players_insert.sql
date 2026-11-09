REVOKE INSERT ON TABLE public.players FROM authenticated;
GRANT INSERT (name, username_norm, user_id, avatar_index) ON TABLE public.players TO authenticated;

CREATE POLICY "no direct tribe quest claims access"
  ON public.tribe_quest_claims
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
