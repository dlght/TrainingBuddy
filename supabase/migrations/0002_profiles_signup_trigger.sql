-- Creates an empty public.profiles row the instant someone signs up, so
-- every other table's `user_id -> profiles.id` foreign key has something to
-- point at immediately. The profile-setup screen fills in the real
-- name/bodyweight/weight_unit/experience_level/goal afterward — see the
-- nullable columns/relaxed checks on profiles in 0001_initial_schema.sql.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, created_at)
  values (new.id, now())
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
