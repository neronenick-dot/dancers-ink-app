-- ============================================================
-- DANCERS INK — SUPABASE SCHEMA
-- Run this in your Supabase SQL editor (Project → SQL Editor → New query)
-- ============================================================

-- ---- PROFILES ---- (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'parent' check (role in ('admin', 'parent')),
  phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- CLASSES ----
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  style text,
  instructor text,
  day_of_week text,
  time_start text,
  time_end text,
  age_range text,
  level text,
  description text,
  price_monthly numeric(8,2),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---- USER CLASS ENROLLMENTS ----
create table if not exists public.user_classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique(user_id, class_id)
);

-- ---- ANNOUNCEMENTS ----
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  type text default 'info' check (type in ('info', 'urgent', 'event')),
  target_all boolean default true,
  published boolean default true,
  created_by uuid references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ---- MEDIA ITEMS ----
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text check (type in ('video', 'audio', 'image', 'document')),
  url text,
  storage_path text,
  thumbnail_url text,
  is_public boolean default true,
  class_id uuid references public.classes(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ---- CHATBOT SETTINGS (singleton row, id always = 1) ----
create table if not exists public.chatbot_settings (
  id integer primary key default 1,
  enabled boolean default false,
  provider text default 'static',
  api_key text,
  system_prompt text,
  welcome_message text default 'Hey! I''m Iris 🩰 Ask me anything about Dancers Ink!',
  quick_replies jsonb default '["What styles do you teach?","What''s the tuition?","How do I book a free trial?","Where is the studio?"]',
  response_pool jsonb default '[]',
  updated_at timestamptz default now(),
  constraint one_row check (id = 1)
);

-- Insert default chatbot settings if not present
insert into public.chatbot_settings (id) values (1) on conflict (id) do nothing;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.user_classes enable row level security;
alter table public.announcements enable row level security;
alter table public.media_items enable row level security;
alter table public.chatbot_settings enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- PROFILES POLICIES ----
drop policy if exists "profiles: users read own" on public.profiles;
create policy "profiles: users read own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: users update own" on public.profiles;
create policy "profiles: users update own" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: admins insert" on public.profiles;
create policy "profiles: admins insert" on public.profiles
  for insert with check (public.is_admin() or id = auth.uid());

-- ---- CLASSES POLICIES ----
drop policy if exists "classes: anyone reads active" on public.classes;
create policy "classes: anyone reads active" on public.classes
  for select using (is_active = true or public.is_admin());

drop policy if exists "classes: admins write" on public.classes;
create policy "classes: admins write" on public.classes
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- USER_CLASSES POLICIES ----
drop policy if exists "user_classes: users manage own" on public.user_classes;
create policy "user_classes: users manage own" on public.user_classes
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---- ANNOUNCEMENTS POLICIES ----
drop policy if exists "announcements: users read published" on public.announcements;
create policy "announcements: users read published" on public.announcements
  for select using (published = true or public.is_admin());

drop policy if exists "announcements: admins write" on public.announcements;
create policy "announcements: admins write" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- MEDIA POLICIES ----
drop policy if exists "media: users read public" on public.media_items;
create policy "media: users read public" on public.media_items
  for select using (is_public = true or public.is_admin());

drop policy if exists "media: admins write" on public.media_items;
create policy "media: admins write" on public.media_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- CHATBOT POLICIES ----
drop policy if exists "chatbot: anyone reads" on public.chatbot_settings;
create policy "chatbot: anyone reads" on public.chatbot_settings
  for select using (auth.uid() is not null);

drop policy if exists "chatbot: admins write" on public.chatbot_settings;
create policy "chatbot: admins write" on public.chatbot_settings
  for all using (public.is_admin()) with check (public.is_admin());


-- ============================================================
-- SEED DATA (demo)
-- ============================================================

-- Demo classes
insert into public.classes (name, style, instructor, day_of_week, time_start, time_end, age_range, level, description, price_monthly, is_active)
values
  ('Little Gems Ballet', 'Ballet', 'Miss Sarah', 'Saturday', '09:00', '09:30', '2.5–4', 'Beginner', 'Introduction to dance through movement, music, and imagination.', 25, true),
  ('Ballet Level 1', 'Ballet', 'Miss Sarah', 'Monday', '16:00', '16:50', '5–8', 'Level 1', 'Foundation ballet technique — barre work, center, and simple combinations.', 40, true),
  ('Ballet Level 2', 'Ballet', 'Miss Sarah', 'Wednesday', '16:00', '16:50', '8–12', 'Level 2', 'Intermediate ballet with pointe preparation and performance choreography.', 40, true),
  ('Hip Hop Juniors', 'Hip Hop', 'Mr. DeShawn', 'Tuesday', '17:00', '17:50', '5–10', 'Beginner', 'High-energy street style built on self-expression and musicality.', 40, true),
  ('Hip Hop Teens', 'Hip Hop', 'Mr. DeShawn', 'Thursday', '18:00', '18:50', '11–17', 'Intermediate', 'Advanced hip hop with freestyle, crew concepts, and performance.', 40, true),
  ('Lyrical & Contemporary', 'Lyrical', 'Miss Elena', 'Wednesday', '17:00', '17:50', '8–17', 'Level 1–3', 'Emotion, storytelling, and movement — where artistry comes alive.', 40, true),
  ('Acro & Tumbling', 'Acro', 'Coach Mike', 'Friday', '16:00', '16:50', '5–17', 'All Levels', 'Cartwheels to aerials — strength and flexibility built safely and progressively.', 40, true),
  ('Tap Basics', 'Tap', 'Miss Sarah', 'Saturday', '10:00', '10:50', '5–12', 'Beginner', 'Rhythm, musicality, and footwork — a joyful introduction to tap.', 40, true)
on conflict do nothing;

-- Demo announcements
insert into public.announcements (title, body, type, target_all, published)
values
  ('Spring 2026 Enrollment is Open! 🎉', 'Sign up now for spring classes — spaces are filling fast. Use the registration link in the app or call us at (480) 322-3911.', 'event', true, true),
  ('Recital Packet Now Available', 'The Spring 2026 Recital Packet is ready. Please download it from the Parent Hub and review all dates, costume info, and ticket details.', 'info', true, true),
  ('Picture Day — March 15', 'Studio picture day is Saturday, March 15. Arrive 20 minutes early in full costume with hair and makeup done.', 'event', true, true)
on conflict do nothing;

-- Default chatbot upsert (already inserted above, just ensuring quick replies are set)
update public.chatbot_settings set
  enabled = true,
  welcome_message = 'Hey! I''m Iris 🩰 Ask me anything about Dancers Ink — classes, recitals, tuition, you name it!',
  quick_replies = '["What styles do you teach?","What''s the tuition?","How do I book a free trial?","Where is the studio?"]'
where id = 1;

-- ============================================================
-- TO SET YOURSELF AS ADMIN:
-- After signing up at /signup, run this in the SQL editor:
--
--   update public.profiles
--   set role = 'admin'
--   where email = 'your@email.com';
--
-- Or use the seed demo users below in Supabase Auth:
-- Go to Auth → Users → Add user:
--   admin@dancersink.app / demo1234  (then set role to admin in SQL)
--   parent@dancersink.app / demo1234  (role stays 'parent')
-- ============================================================
