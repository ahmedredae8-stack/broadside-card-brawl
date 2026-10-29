alter table public.players add column if not exists avatar_url text;

alter table public.players add constraint players_avatar_url_len check (avatar_url is null or length(avatar_url) < 200000);

COMMENT ON COLUMN public.players.avatar_url IS 'Player profile picture URL, uploaded from the art studio';