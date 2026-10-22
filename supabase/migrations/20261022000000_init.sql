-- TRACKR initial schema: profiles, friendships, libraries, tribe feed, reactions and match votes.
-- Every table has RLS. A user sees their own rows and their accepted friends' rows.

create extension if not exists citext;

-- Profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username citext not null unique check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  colors text[] not null default array['#6ee7b7', '#0d9488'],
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Open registration: any signed-in user can find others by username.
create policy "profiles are readable by signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "users update their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Sign-up sends { username, display_name } as user metadata; the profile is created here.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), new.raw_user_meta_data ->> 'username')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Friendships ----------------------------------------------------------------

create table public.friendships (
  requester uuid not null references public.profiles on delete cascade,
  addressee uuid not null references public.profiles on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);

alter table public.friendships enable row level security;

create policy "both sides read the friendship" on public.friendships
  for select to authenticated using ((select auth.uid()) in (requester, addressee));
create policy "users send requests as themselves" on public.friendships
  for insert to authenticated with check (requester = (select auth.uid()) and status = 'pending');
create policy "addressee accepts" on public.friendships
  for update to authenticated using (addressee = (select auth.uid())) with check (status = 'accepted');
create policy "either side removes" on public.friendships
  for delete to authenticated using ((select auth.uid()) in (requester, addressee));

-- Accepting may only flip the status; otherwise the addressee could rewrite `requester`.
revoke update on public.friendships from authenticated;
grant update (status) on public.friendships to authenticated;

-- True when `owner` is the caller or an accepted friend of the caller.
-- Always checks against auth.uid(), so callers can only test their own relationships.
create function public.can_see(owner uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select owner = auth.uid() or exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = auth.uid() and f.addressee = owner) or (f.requester = owner and f.addressee = auth.uid()))
  )
$$;

revoke execute on function public.can_see(uuid) from public, anon;
grant execute on function public.can_see(uuid) to authenticated;

-- Library ----------------------------------------------------------------------

-- One row per tracked title. `key` is libKey() from @trackr/core (type + normalized title).
create table public.library_items (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  key text not null,
  item jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.library_items enable row level security;

create policy "owner and friends read libraries" on public.library_items
  for select to authenticated using (public.can_see(user_id));
create policy "owner inserts" on public.library_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "owner updates" on public.library_items
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "owner deletes" on public.library_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- Tribe feed -------------------------------------------------------------------

create table public.feed_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  verb text not null check (verb in ('completed', 'added', 'playing', 'super', 'rated', 'match', 'synced')),
  extra text,
  item jsonb not null,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index feed_events_user_created on public.feed_events (user_id, created_at desc);

alter table public.feed_events enable row level security;

create policy "owner and friends read events" on public.feed_events
  for select to authenticated using (public.can_see(user_id));
create policy "owner posts events" on public.feed_events
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "owner deletes events" on public.feed_events
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.reactions (
  event_id uuid not null references public.feed_events on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  emoji text not null check (emoji in ('🔥', '👏', '🤯')),
  primary key (event_id, user_id, emoji)
);

alter table public.reactions enable row level security;

-- The subquery runs under the caller's RLS, so only reactions on visible events are readable.
create policy "read reactions on visible events" on public.reactions
  for select to authenticated using (exists (select 1 from public.feed_events e where e.id = event_id));
create policy "react to visible events" on public.reactions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.feed_events e where e.id = event_id));
create policy "remove own reaction" on public.reactions
  for delete to authenticated using (user_id = (select auth.uid()));

-- TrackrMatch votes ------------------------------------------------------------

create table public.match_votes (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  item_key text not null,
  item jsonb not null,
  vote text not null check (vote in ('pass', 'like', 'super')),
  created_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.match_votes enable row level security;

create policy "owner and friends read votes" on public.match_votes
  for select to authenticated using (public.can_see(user_id));
create policy "owner votes" on public.match_votes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "owner changes vote" on public.match_votes
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "owner removes vote" on public.match_votes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Live feed updates. Realtime DELETE events skip RLS and carry the primary key, so only tables
-- with an opaque key are published; reactions and votes need private Broadcast channels instead.
alter publication supabase_realtime add table public.feed_events;
