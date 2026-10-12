-- BUYAKA PUMA SMART ASSISTANT: personel ve eğitim takibi
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'staff' check (role in ('staff','manager')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.training_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.staff_profiles(user_id) on delete cascade,
  training_title text not null,
  training_date date not null,
  completed_at timestamptz not null default now(),
  unique (user_id, training_title, training_date)
);

create or replace function public.create_staff_profile()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.staff_profiles (user_id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'staff')
  on conflict (user_id) do update set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_staff_profile on auth.users;
create trigger on_auth_user_created_staff_profile
after insert on auth.users
for each row execute procedure public.create_staff_profile();

alter table public.staff_profiles enable row level security;
alter table public.training_completions enable row level security;

drop policy if exists "staff can read own profile, managers read all" on public.staff_profiles;
create policy "staff can read own profile, managers read all" on public.staff_profiles
for select to authenticated using (
  user_id = auth.uid() or exists (
    select 1 from public.staff_profiles manager
    where manager.user_id = auth.uid() and manager.role = 'manager' and manager.active = true
  )
);

drop policy if exists "staff can read own completions, managers read all" on public.training_completions;
create policy "staff can read own completions, managers read all" on public.training_completions
for select to authenticated using (
  user_id = auth.uid() or exists (
    select 1 from public.staff_profiles manager
    where manager.user_id = auth.uid() and manager.role = 'manager' and manager.active = true
  )
);

drop policy if exists "staff can record own completion" on public.training_completions;
create policy "staff can record own completion" on public.training_completions
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "staff can update own completion timestamp" on public.training_completions;
create policy "staff can update own completion timestamp" on public.training_completions
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- İlk yönetici hesabını Supabase Dashboard > Authentication > Users bölümünde
-- yonetici@staff.buyakapuma.com e-postasıyla oluşturduktan sonra bu satırı çalıştırın:
-- update public.staff_profiles sp set role = 'manager'
-- from auth.users u where sp.user_id = u.id and u.email = 'yonetici@staff.buyakapuma.com';

-- Yönetici, hesapları sadece Edge Function üzerinden oluşturur.
