-- Social: public profiles and global feed, half-star ratings, community rating histogram,
-- image storage and account deletion.

-- Profiles -------------------------------------------------------------------

alter table public.profiles
  add column bio text not null default '' check (char_length(bio) <= 160),
  add column avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  -- Public profiles post to the global feed; private ones are only seen by accepted friends.
  -- Opt-in: nobody's activity becomes public without choosing it.
  add column is_public boolean not null default false;

-- Global feed ------------------------------------------------------------------

alter table public.feed_events drop constraint feed_events_rating_check;
alter table public.feed_events
  alter column rating type numeric(2, 1),
  add constraint feed_events_rating_check check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2));

create index feed_events_created on public.feed_events (created_at desc);

create policy "public profiles' events are readable" on public.feed_events
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = user_id and p.is_public));

-- Community ratings --------------------------------------------------------------

create index library_items_key on public.library_items (key);

-- How many users gave each rating to one title. Counts public profiles only, and returns
-- nothing below 5 ratings so a small histogram can't reveal one person's rating.
create function public.rating_histogram(item_key text)
returns table (rating numeric, n bigint)
language sql stable security definer set search_path = '' as $$
  with rated as (
    select (l.item ->> 'myRating')::numeric as rating
    from public.library_items l
    join public.profiles p on p.id = l.user_id and p.is_public
    where l.key = item_key and jsonb_typeof(l.item -> 'myRating') = 'number'
  )
  select rating, count(*) from rated
  where (select count(*) from rated) >= 5
  group by rating
$$;

revoke execute on function public.rating_histogram(text) from public, anon;
grant execute on function public.rating_histogram(text) to authenticated;

-- Images -------------------------------------------------------------------------

-- Avatars and custom posters/banners. Public read; each user writes only under their own folder: <uid>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('artwork', 'artwork', true, 4194304, array['image/jpeg', 'image/png', 'image/webp']);

create policy "users upload to their folder" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatars', 'artwork') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users replace their files" on storage.objects
  for update to authenticated
  using (bucket_id in ('avatars', 'artwork') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users delete their files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('avatars', 'artwork') and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Account deletion -----------------------------------------------------------------

-- Deletes the caller's auth user; profiles, libraries, friendships, events and votes cascade.
-- The app removes the caller's storage files first (storage tables can't be deleted from SQL).
create function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid()
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
