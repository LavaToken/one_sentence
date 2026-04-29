-- One Sentence at a Time — initial schema

create extension if not exists "pgcrypto";

create table if not exists sentences (
  id           uuid primary key default gen_random_uuid(),
  order_index  integer unique not null,
  text         varchar(280) not null,
  author       varchar(50),
  style        varchar(10) not null default 'normal'
                 check (style in ('normal','bold','italic')),
  paid_amount  integer not null,
  status       varchar(10) not null default 'pending'
                 check (status in ('pending','live','removed')),
  created_at   timestamptz not null default now()
);

-- Fast ordered reads of the live story.
create index if not exists sentences_live_order_idx
  on sentences (order_index)
  where status = 'live';

-- Helpful for cleanup of stale pending rows.
create index if not exists sentences_pending_created_idx
  on sentences (created_at)
  where status = 'pending';

-- Row Level Security: anonymous readers can SELECT live + removed only.
-- Writes are performed exclusively by the service role (server endpoints).
alter table sentences enable row level security;

drop policy if exists "anon read live and removed" on sentences;
create policy "anon read live and removed"
  on sentences
  for select
  to anon, authenticated
  using (status in ('live','removed'));

-- Realtime: publish changes for the sentences table.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sentences'
  ) then
    execute 'alter publication supabase_realtime add table sentences';
  end if;
end
$$;

-- Seed: the opening sentence, owner-written.
insert into sentences (order_index, text, author, status, paid_amount)
values (
  1,
  'The last cartographer alive had drawn only one map, and it led somewhere no one was supposed to find.',
  'the author',
  'live',
  0
)
on conflict (order_index) do nothing;
