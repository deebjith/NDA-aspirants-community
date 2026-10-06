-- Air Force Day 2026 private challenge submissions.
-- Keep participant details and scores inaccessible to browser clients; only the
-- SECURITY DEFINER submission function may write, and only administrators may read.
create table if not exists public.airforce_day_scores (
  id bigint generated always as identity primary key,
  event_year smallint not null default 2026 check (event_year = 2026),
  score smallint not null check (score between 0 and 25),
  question_count smallint not null default 25 check (question_count = 25),
  certificate_name text not null check (char_length(certificate_name) between 1 and 80),
  certificate_email text not null check (char_length(certificate_email) between 3 and 254),
  certificate_consent boolean not null check (certificate_consent),
  participant_id uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now()
);

alter table public.airforce_day_scores enable row level security;
revoke all on table public.airforce_day_scores from anon, authenticated;

create or replace function public.submit_airforce_day_result(
  p_answers smallint[],
  p_certificate_name text,
  p_certificate_email text,
  p_certificate_consent boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  answer_key constant smallint[] := array[
    0,2,1,1,0,0,1,2,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2
  ];
  result_score smallint := 0;
  i integer;
  clean_name text := btrim(p_certificate_name);
  clean_email text := lower(btrim(p_certificate_email));
begin
  if p_answers is null or cardinality(p_answers) <> 25 then
    raise exception 'The Air Force Day challenge must contain all 25 answers.' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(p_answers) answer where answer < 0 or answer > 3) then
    raise exception 'An answer choice is invalid.' using errcode = '22023';
  end if;
  if clean_name is null or char_length(clean_name) not between 1 and 80 then
    raise exception 'Enter a certificate name between 1 and 80 characters.' using errcode = '22023';
  end if;
  if clean_email is null or char_length(clean_email) > 254 or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid certificate email address.' using errcode = '22023';
  end if;
  if p_certificate_consent is distinct from true then
    raise exception 'Consent is required to store certificate details.' using errcode = '22023';
  end if;

  for i in 1..25 loop
    if p_answers[i] = answer_key[i] then result_score := result_score + 1; end if;
  end loop;

  insert into public.airforce_day_scores (
    score, question_count, certificate_name, certificate_email, certificate_consent, participant_id
  ) values (
    result_score, 25, clean_name, clean_email, p_certificate_consent, auth.uid()
  );
end;
$$;

revoke all on function public.submit_airforce_day_result(smallint[], text, text, boolean) from public;
grant execute on function public.submit_airforce_day_result(smallint[], text, text, boolean) to anon, authenticated;

comment on table public.airforce_day_scores is
  'Private Air Force Day challenge scores and certificate delivery details. No client read policy is provided.';
