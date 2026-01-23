create table if not exists public.trips (
  id text primary key,
  payload jsonb not null,
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_updated_at_idx on public.trips (updated_at desc);
create index if not exists trips_share_token_idx on public.trips (share_token);
