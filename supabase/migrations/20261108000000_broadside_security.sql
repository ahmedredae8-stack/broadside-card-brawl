CREATE TABLE public.tribe_quest_claims (
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL CHECK (quest_id IN ('catch','sell','sail')),
  claimed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (player_id, quest_id, claimed_on)
);
ALTER TABLE public.tribe_quest_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tribe_quest_claims FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.tribe_quest_claims TO service_role;

CREATE OR REPLACE FUNCTION public.claim_tribe_quest(_player_id UUID, _quest_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  reward INTEGER;
  target_tribe_id UUID;
BEGIN
  reward := CASE _quest_id
    WHEN 'catch' THEN 60
    WHEN 'sell' THEN 90
    WHEN 'sail' THEN 120
    ELSE 0
  END;
  IF reward = 0 THEN RETURN 0; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = _player_id AND p.user_id = auth.uid()
  ) THEN
    RETURN 0;
  END IF;

  SELECT tm.tribe_id INTO target_tribe_id
  FROM public.tribe_members tm
  WHERE tm.player_id = _player_id;
  IF target_tribe_id IS NULL THEN RETURN 0; END IF;

  INSERT INTO public.tribe_quest_claims (player_id, quest_id)
  VALUES (_player_id, _quest_id)
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;

  UPDATE public.tribe_members
  SET contribution = contribution + reward
  WHERE player_id = _player_id;
  UPDATE public.tribes
  SET score = score + reward
  WHERE id = target_tribe_id;
  RETURN reward;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_tribe_quest(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_tribe_quest(UUID, TEXT) TO authenticated;
