-- Run this SQL in your Supabase SQL editor to create the required tables.

create table if not exists surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  email_subject text not null,
  intro_text text not null default '',
  sent_count integer not null default 0,
  response_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  order_index integer not null default 0,
  text text not null,
  type text not null check (type in ('dropdown', 'text', 'rating')),
  required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  text text not null,
  value text not null,
  created_at timestamptz not null default now()
);

create table if not exists survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  respondent_email text not null,
  submitted_at timestamptz not null default now()
);

create table if not exists response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references survey_responses(id) on delete cascade,
  question_id uuid not null,
  question_text text not null,
  answer_value text not null,
  answer_text text not null
);

-- Enable RLS
alter table surveys enable row level security;
alter table questions enable row level security;
alter table answer_options enable row level security;
alter table survey_responses enable row level security;
alter table response_answers enable row level security;

-- Allow service role full access (used by server-side API)
-- Public read access for the response endpoint (allows AMP form submission)
create policy "Service role full access to surveys" on surveys
  using (true) with check (true);

create policy "Service role full access to questions" on questions
  using (true) with check (true);

create policy "Service role full access to answer_options" on answer_options
  using (true) with check (true);

create policy "Service role full access to survey_responses" on survey_responses
  using (true) with check (true);

create policy "Service role full access to response_answers" on response_answers
  using (true) with check (true);
