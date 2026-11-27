create table public.profiles (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  public_token text unique not null check (pg_catalog.length(public_token) >= 22),
  full_name text not null,
  age int not null check (age between 0 and 120),
  blood_group text not null check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies text[] not null default '{}',
  conditions text[] not null default '{}',
  medicines text[] not null default '{}',
  doctor_name text not null default '',
  "public" jsonb not null default '{"allergies":false,"conditions":false,"medicines":false,"doctor_name":false}',
  created_at timestamptz default pg_catalog.now()
);

create table public.contacts (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone text not null,
  relation text not null,
  position smallint not null
);

create table public.scan_logs (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles (id) on delete cascade,
  scanned_at timestamptz default pg_catalog.now()
);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);

create index profiles_owner_id_idx on public.profiles (owner_id);
create index contacts_profile_id_idx on public.contacts (profile_id);
create index scan_logs_profile_id_idx on public.scan_logs (profile_id);

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.scan_logs enable row level security;
alter table public.rate_limits enable row level security;

revoke all on table public.profiles, public.contacts, public.scan_logs, public.rate_limits
  from public, anon, authenticated;
grant select, insert, update, delete on table public.profiles, public.contacts to authenticated;
grant select on table public.scan_logs to authenticated;

create policy profiles_owner_access on public.profiles
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy contacts_owner_access on public.contacts
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles as profile
      where profile.id = contacts.profile_id
        and profile.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.profiles as profile
      where profile.id = contacts.profile_id
        and profile.owner_id = (select auth.uid())
    )
  );

create policy scan_logs_owner_select on public.scan_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles as profile
      where profile.id = scan_logs.profile_id
        and profile.owner_id = (select auth.uid())
    )
  );

create function public.create_profile(payload jsonb, p_public_token text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_profile_id uuid;
begin
  if pg_catalog.jsonb_array_length(payload -> 'contacts') > 3 then
    raise exception 'A profile can have at most 3 contacts' using errcode = '22023';
  end if;

  insert into public.profiles (
    owner_id, public_token, full_name, age, blood_group,
    allergies, conditions, medicines, doctor_name, "public"
  ) values (
    auth.uid(),
    p_public_token,
    payload ->> 'full_name',
    (payload ->> 'age')::int,
    payload ->> 'blood_group',
    array(select pg_catalog.jsonb_array_elements_text(payload -> 'allergies')),
    array(select pg_catalog.jsonb_array_elements_text(payload -> 'conditions')),
    array(select pg_catalog.jsonb_array_elements_text(payload -> 'medicines')),
    coalesce(payload ->> 'doctor_name', ''),
    coalesce(payload -> 'public', '{}'::jsonb)
  )
  returning id into v_profile_id;

  insert into public.contacts (profile_id, name, phone, relation, position)
  select v_profile_id, contact.value ->> 'name', contact.value ->> 'phone',
    contact.value ->> 'relation', contact.position::smallint
  from pg_catalog.jsonb_array_elements(payload -> 'contacts')
    with ordinality as contact(value, position);

  return pg_catalog.jsonb_build_object('id', v_profile_id, 'public_token', p_public_token);
end;
$function$;

create function public.update_profile(p_id uuid, payload jsonb)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.profiles
  set full_name = payload ->> 'full_name',
      age = (payload ->> 'age')::int,
      blood_group = payload ->> 'blood_group',
      allergies = array(select pg_catalog.jsonb_array_elements_text(payload -> 'allergies')),
      conditions = array(select pg_catalog.jsonb_array_elements_text(payload -> 'conditions')),
      medicines = array(select pg_catalog.jsonb_array_elements_text(payload -> 'medicines')),
      doctor_name = coalesce(payload ->> 'doctor_name', ''),
      "public" = coalesce(payload -> 'public', '{}'::jsonb)
  where id = p_id;

  if not found then
    return false;
  end if;

  if pg_catalog.jsonb_array_length(payload -> 'contacts') > 3 then
    raise exception 'A profile can have at most 3 contacts' using errcode = '22023';
  end if;

  delete from public.contacts where profile_id = p_id;

  insert into public.contacts (profile_id, name, phone, relation, position)
  select p_id, contact.value ->> 'name', contact.value ->> 'phone',
    contact.value ->> 'relation', contact.position::smallint
  from pg_catalog.jsonb_array_elements(payload -> 'contacts')
    with ordinality as contact(value, position);

  return true;
end;
$function$;

create function public.get_public_profile(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_profile public.profiles%rowtype;
  v_contacts jsonb;
begin
  select profile.* into v_profile
  from public.profiles as profile
  where profile.public_token = p_token;

  if not found then
    return null;
  end if;

  insert into public.scan_logs (profile_id) values (v_profile.id);

  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('name', contact.name, 'phone', contact.phone, 'relation', contact.relation)
      order by contact.position
    ),
    '[]'::jsonb
  ) into v_contacts
  from public.contacts as contact
  where contact.profile_id = v_profile.id;

  return pg_catalog.jsonb_build_object(
    'full_name', v_profile.full_name,
    'age', v_profile.age,
    'blood_group', v_profile.blood_group,
    'contacts', v_contacts
  )
  || case when v_profile."public" @> '{"allergies":true}'::jsonb
       then pg_catalog.jsonb_build_object('allergies', v_profile.allergies) else '{}'::jsonb end
  || case when v_profile."public" @> '{"conditions":true}'::jsonb
       then pg_catalog.jsonb_build_object('conditions', v_profile.conditions) else '{}'::jsonb end
  || case when v_profile."public" @> '{"medicines":true}'::jsonb
       then pg_catalog.jsonb_build_object('medicines', v_profile.medicines) else '{}'::jsonb end
  || case when v_profile."public" @> '{"doctor_name":true}'::jsonb
       then pg_catalog.jsonb_build_object('doctor_name', v_profile.doctor_name) else '{}'::jsonb end;
end;
$function$;

create function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.statement_timestamp();
  v_window_cutoff timestamptz := v_now - pg_catalog.make_interval(secs => p_window_seconds);
begin
  if p_key is null or p_limit is null or p_limit < 1
    or p_window_seconds is null or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.rate_limits as current_limit (key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (key) do update
  set window_start = case when current_limit.window_start <= v_window_cutoff
                          then excluded.window_start else current_limit.window_start end,
      count = case when current_limit.window_start <= v_window_cutoff
                   then 1 else current_limit.count + 1 end
  where current_limit.window_start <= v_window_cutoff or current_limit.count < p_limit;

  return found;
end;
$function$;

revoke execute on function public.create_profile(jsonb, text) from public, anon, authenticated;
revoke execute on function public.update_profile(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.get_public_profile(text) from public, anon, authenticated;
revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;

grant execute on function public.create_profile(jsonb, text) to authenticated;
grant execute on function public.update_profile(uuid, jsonb) to authenticated;
grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to anon, authenticated;
