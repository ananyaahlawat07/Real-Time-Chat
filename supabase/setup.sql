-- ============================================================
-- Realtime Chat - Supabase setup
-- Run this whole file once in your Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================

-- 1) Rooms: each chat session gets a short private code
create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  created_at timestamptz not null default now()
);

-- 2) Messages: all chat messages, linked to a room
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  room_id     uuid not null references public.rooms (id) on delete cascade,
  sender_name text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- 3) Row Level Security: for this demo everyone may read/write.
--    (RLS is enabled so Realtime works properly.)
alter table public.rooms    enable row level security;
alter table public.messages enable row level security;

drop policy if exists "rooms can create" on public.rooms;
drop policy if exists "rooms can read"   on public.rooms;
drop policy if exists "messages are public" on public.messages;

create policy "rooms can create" on public.rooms
  for insert with check (true);

create policy "rooms can read" on public.rooms
  for select using (true);

create policy "messages are public" on public.messages
  for all using (true) with check (true);

-- 4) Enable Realtime for the messages table so new messages
--    push instantly to every connected client.
alter publication supabase_realtime add table public.messages;

-- 5) Indexes so joining a room by code and listing messages are fast
create index if not exists rooms_code_idx on public.rooms (code);
create index if not exists messages_room_idx on public.messages (room_id, created_at);