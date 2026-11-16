-- The Color Code — customer-service chat log. Paste all of this into Supabase → SQL Editor → Run.
-- Safe to run more than once. Run supabase/schema.sql first (this uses its is_team() function).
-- Charter: docs/customer-service/CLAUDE.md.

-- Every chat message, one row each. The server removes emails, phone numbers, card numbers,
-- passwords and stated names before writing, and this table holds no account or visitor id:
-- a conversation is only a random id made fresh in the visitor's browser.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id text not null check (length(conversation_id) between 8 and 64),
  role text not null check (role in ('user', 'assistant')),
  message text not null check (length(message) <= 2000),
  -- Why a reply was replaced by a safe answer: money, date, secrets, promise, empty or error.
  flag text check (flag in ('money', 'date', 'secrets', 'promise', 'empty', 'error'))
);
create index if not exists chat_messages_conv_idx on public.chat_messages (conversation_id, created_at);
create index if not exists chat_messages_created_idx on public.chat_messages (created_at);

-- Questions a visitor asked us to pass to a person. This is the ONLY place a chat email is kept,
-- because the visitor typed it so we could reply. Delete each row once it has been answered.
create table if not exists public.chat_handoffs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id text not null check (length(conversation_id) between 8 and 64),
  email text not null check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  question text not null check (length(question) <= 2000),
  answered_on date
);

-- The website's server writes through these two functions only.
create or replace function public.log_chat_message(p_conversation_id text, p_role text, p_message text, p_flag text default null)
returns void language sql security definer set search_path = public
as $$
  insert into public.chat_messages (conversation_id, role, message, flag)
  values (p_conversation_id, p_role, left(p_message, 2000), p_flag)
$$;

create or replace function public.request_chat_handoff(p_conversation_id text, p_email text, p_question text)
returns void language sql security definer set search_path = public
as $$
  insert into public.chat_handoffs (conversation_id, email, question)
  values (p_conversation_id, lower(btrim(p_email)), left(p_question, 2000))
$$;

alter table public.chat_messages enable row level security;
alter table public.chat_handoffs enable row level security;

-- Only the team can read them (and mark handoffs answered or delete them).
drop policy if exists "team reads chat" on public.chat_messages;
create policy "team reads chat" on public.chat_messages for select to authenticated using (public.is_team());
drop policy if exists "team reads handoffs" on public.chat_handoffs;
create policy "team reads handoffs" on public.chat_handoffs for select to authenticated using (public.is_team());
drop policy if exists "team updates handoffs" on public.chat_handoffs;
create policy "team updates handoffs" on public.chat_handoffs for update to authenticated using (public.is_team()) with check (public.is_team());
drop policy if exists "team deletes handoffs" on public.chat_handoffs;
create policy "team deletes handoffs" on public.chat_handoffs for delete to authenticated using (public.is_team());

revoke all on public.chat_messages, public.chat_handoffs from anon;
grant select on public.chat_messages to authenticated;
grant select, update, delete on public.chat_handoffs to authenticated;
revoke all on function public.log_chat_message(text, text, text, text) from public;
revoke all on function public.request_chat_handoff(text, text, text) from public;
grant execute on function public.log_chat_message(text, text, text, text) to anon, authenticated;
grant execute on function public.request_chat_handoff(text, text, text) to anon, authenticated;

-- Each morning: questions waiting for a person.
-- select created_at, email, question from public.chat_handoffs where answered_on is null order by created_at;
-- Once answered:  delete from public.chat_handoffs where id = '...';
