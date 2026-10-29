CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE,
  name TEXT NOT NULL,
  username_norm TEXT UNIQUE,
  theme_id TEXT NOT NULL DEFAULT 'bay-day',
  avatar_index INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_select" ON public.players FOR SELECT TO authenticated USING (true);
CREATE POLICY "players_insert_own" ON public.players FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "players_update_own" ON public.players FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "players_delete_own" ON public.players FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.owns_player(_player_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.players p WHERE p.id = _player_id AND p.user_id = auth.uid()) $$;
REVOKE ALL ON FUNCTION public.owns_player(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_player(uuid) TO authenticated;

CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships_select" ON public.friendships FOR SELECT TO authenticated USING (public.owns_player(requester_id) OR public.owns_player(addressee_id));
CREATE POLICY "friendships_insert" ON public.friendships FOR INSERT TO authenticated WITH CHECK (public.owns_player(requester_id));
CREATE POLICY "friendships_update" ON public.friendships FOR UPDATE TO authenticated USING (public.owns_player(requester_id) OR public.owns_player(addressee_id)) WITH CHECK (public.owns_player(requester_id) OR public.owns_player(addressee_id));
CREATE POLICY "friendships_delete" ON public.friendships FOR DELETE TO authenticated USING (public.owns_player(requester_id) OR public.owns_player(addressee_id));

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated USING (recipient_id IS NULL OR public.owns_player(sender_id) OR public.owns_player(recipient_id));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (public.owns_player(sender_id));
CREATE POLICY "messages_delete_own" ON public.messages FOR DELETE TO authenticated USING (public.owns_player(sender_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE TABLE public.tribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emblem TEXT NOT NULL DEFAULT 'skull',
  motto TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  owner_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribes TO authenticated;
GRANT ALL ON public.tribes TO service_role;
ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tribes_select" ON public.tribes FOR SELECT TO authenticated USING (true);
CREATE POLICY "tribes_insert" ON public.tribes FOR INSERT TO authenticated WITH CHECK (public.owns_player(owner_id));
CREATE POLICY "tribes_update" ON public.tribes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tribes_delete" ON public.tribes FOR DELETE TO authenticated USING (public.owns_player(owner_id));

CREATE TABLE public.tribe_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  player_id UUID NOT NULL UNIQUE REFERENCES public.players(id) ON DELETE CASCADE,
  rank TEXT NOT NULL DEFAULT 'member',
  contribution INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribe_members TO authenticated;
GRANT ALL ON public.tribe_members TO service_role;
ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tribe_members_select" ON public.tribe_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "tribe_members_insert" ON public.tribe_members FOR INSERT TO authenticated WITH CHECK (public.owns_player(player_id));
CREATE POLICY "tribe_members_update" ON public.tribe_members FOR UPDATE TO authenticated USING (public.owns_player(player_id) OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_id AND public.owns_player(t.owner_id))) WITH CHECK (true);
CREATE POLICY "tribe_members_delete" ON public.tribe_members FOR DELETE TO authenticated USING (public.owns_player(player_id) OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_id AND public.owns_player(t.owner_id)));

CREATE TABLE public.fleet_layout (
  id text NOT NULL PRIMARY KEY,
  lanes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fleet_layout TO anon;
GRANT SELECT, INSERT, UPDATE ON public.fleet_layout TO authenticated;
GRANT ALL ON public.fleet_layout TO service_role;
ALTER TABLE public.fleet_layout ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fleet_layout_select" ON public.fleet_layout FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER fleet_layout_touch BEFORE UPDATE ON public.fleet_layout
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.fleet_layout (id, lanes) VALUES ('default', '[
  {"id":1,"dockX":50,"dockY":57,"fishX":74,"fishY":57,"size":26},
  {"id":2,"dockX":39,"dockY":68,"fishX":68,"fishY":68,"size":28},
  {"id":3,"dockX":41,"dockY":79,"fishX":69,"fishY":79,"size":30}
]'::jsonb);

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id, role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.artwork_poses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), category text NOT NULL, subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 60), pose text NOT NULL, image_path text NOT NULL UNIQUE, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.artwork_poses ADD CONSTRAINT artwork_category_chk CHECK (category IN ('ship','rocket','background'));
ALTER TABLE public.artwork_poses ADD CONSTRAINT artwork_pose_chk CHECK (pose IN ('idle','cast','submerged','haul','flight','explosion','fire','smoke','fade','day','night'));
GRANT SELECT ON public.artwork_poses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.artwork_poses TO authenticated;
GRANT ALL ON public.artwork_poses TO service_role;
ALTER TABLE public.artwork_poses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view artwork" ON public.artwork_poses FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER artwork_poses_touch BEFORE UPDATE ON public.artwork_poses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER PUBLICATION supabase_realtime ADD TABLE public.artwork_poses;

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;
CREATE FUNCTION private.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
CREATE POLICY "admins upload artwork" ON public.artwork_poses FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin') AND created_by = auth.uid() AND image_path LIKE auth.uid()::text || '/%');
CREATE POLICY "admins edit artwork" ON public.artwork_poses FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins remove artwork" ON public.artwork_poses FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins publish fleet layouts" ON public.fleet_layout FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update fleet layouts" ON public.fleet_layout FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "signed in players view artwork files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'game-artwork');
CREATE POLICY "admins upload artwork files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'game-artwork' AND private.has_role(auth.uid(), 'admin') AND (storage.foldername(name))[1] = auth.uid()::text AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','mp4','webm'));
CREATE POLICY "admins delete artwork files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'game-artwork' AND private.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ship_overrides (
  product_id text PRIMARY KEY,
  name text,
  description text,
  price integer,
  hidden boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ship_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ship_overrides TO authenticated;
GRANT ALL ON public.ship_overrides TO service_role;
ALTER TABLE public.ship_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view overrides" ON public.ship_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write overrides" ON public.ship_overrides FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE TABLE public.catches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  fish_id text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.catches TO authenticated;
GRANT ALL ON public.catches TO service_role;
ALTER TABLE public.catches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own catches read" ON public.catches FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own catches add" ON public.catches FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND qty BETWEEN 1 AND 50);
CREATE POLICY "own catches sell" ON public.catches FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.grant_admin_to_owner_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'admin@islandbay.game' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.grant_admin_to_owner_account() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_grant_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_to_owner_account();