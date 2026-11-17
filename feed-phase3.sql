-- UniSkill Hub Feed Phase 3. Run once in Supabase SQL Editor.
-- Keeps existing feed posts, likes, comments and images intact.
create table if not exists public.feed_bookmarks (
 post_id uuid not null references public.feed_posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(post_id,user_id)
);
create table if not exists public.feed_notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references auth.users(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 post_id uuid references public.feed_posts(id) on delete cascade,
 kind text not null check(kind in ('like','comment')),
 is_read boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists feed_notifications_recipient_idx on public.feed_notifications(recipient_id,created_at desc);
create index if not exists feed_bookmarks_user_idx on public.feed_bookmarks(user_id,created_at desc);
alter table public.feed_bookmarks enable row level security;
alter table public.feed_notifications enable row level security;
drop policy if exists "feed_bookmarks_read" on public.feed_bookmarks;
drop policy if exists "feed_bookmarks_create" on public.feed_bookmarks;
drop policy if exists "feed_bookmarks_delete" on public.feed_bookmarks;
create policy "feed_bookmarks_read" on public.feed_bookmarks for select to authenticated using(user_id=(select auth.uid()));
create policy "feed_bookmarks_create" on public.feed_bookmarks for insert to authenticated with check(user_id=(select auth.uid()));
create policy "feed_bookmarks_delete" on public.feed_bookmarks for delete to authenticated using(user_id=(select auth.uid()));
drop policy if exists "feed_notifications_read" on public.feed_notifications;
drop policy if exists "feed_notifications_update" on public.feed_notifications;
create policy "feed_notifications_read" on public.feed_notifications for select to authenticated using(recipient_id=(select auth.uid()));
create policy "feed_notifications_update" on public.feed_notifications for update to authenticated using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));
-- Notifications are inserted only by server-side triggers, not client users.
create or replace function public.feed_notify_on_like()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
 select user_id into owner_id from public.feed_posts where id=new.post_id;
 if owner_id is not null and owner_id<>new.user_id then
  insert into public.feed_notifications(recipient_id,actor_id,post_id,kind)
  values(owner_id,new.user_id,new.post_id,'like');
 end if;
 return new;
end; $$;
create or replace function public.feed_notify_on_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
 select user_id into owner_id from public.feed_posts where id=new.post_id;
 if owner_id is not null and owner_id<>new.user_id then
  insert into public.feed_notifications(recipient_id,actor_id,post_id,kind)
  values(owner_id,new.user_id,new.post_id,'comment');
 end if;
 return new;
end; $$;
drop trigger if exists feed_like_notify_trigger on public.feed_likes;
create trigger feed_like_notify_trigger after insert on public.feed_likes
for each row execute function public.feed_notify_on_like();
drop trigger if exists feed_comment_notify_trigger on public.feed_comments;
create trigger feed_comment_notify_trigger after insert on public.feed_comments
for each row execute function public.feed_notify_on_comment();
-- Notifications are created for NEW likes/comments after this migration.
