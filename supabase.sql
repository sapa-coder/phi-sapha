-- วางทั้งหมดใน Supabase > SQL Editor > Run
create table profiles(id uuid primary key references auth.users on delete cascade,
  full_name text,student_id text unique,classroom text,is_admin boolean default false,created_at timestamptz default now());
create table summaries(id bigint generated always as identity primary key,user_id uuid references auth.users on delete set null,
  file_url text,thumb_url text,author_name text,classroom text,level text,category text,description text,created_at timestamptz default now());
create table portfolios(id bigint generated always as identity primary key,title text,description text,image_url text,link text,created_at timestamptz default now());
create table favorites(user_id uuid references auth.users on delete cascade,summary_id bigint references summaries on delete cascade,primary key(user_id,summary_id));

create function is_admin() returns boolean language sql security definer as $$ select coalesce((select is_admin from profiles where id=auth.uid()),false) $$;
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles(id,full_name,student_id,classroom) values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'student_id',new.raw_user_meta_data->>'classroom'); return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security;alter table summaries enable row level security;
alter table portfolios enable row level security;alter table favorites enable row level security;
create policy "own profile" on profiles for select using(id=auth.uid() or is_admin());
create policy "admin edit profile" on profiles for update using(is_admin());
create policy "read sum" on summaries for select to authenticated using(true);
create policy "add sum" on summaries for insert to authenticated with check(user_id=auth.uid());
create policy "del sum" on summaries for delete using(user_id=auth.uid() or is_admin());
create policy "admin edit sum" on summaries for update using(is_admin());
create policy "read folio" on portfolios for select to authenticated using(true);
create policy "admin folio" on portfolios for all using(is_admin()) with check(is_admin());
create policy "my favs" on favorites for all using(user_id=auth.uid()) with check(user_id=auth.uid());

insert into storage.buckets(id,name,public) values('files','files',true);
create policy "read files" on storage.objects for select using(bucket_id='files');
create policy "upload files" on storage.objects for insert to authenticated with check(bucket_id='files' and (storage.foldername(name))[1]=auth.uid()::text);
-- ตั้งตัวเองเป็นแอดมินหลังสมัครแล้ว: update profiles set is_admin=true where student_id='เลขประจำตัวของคุณ';
