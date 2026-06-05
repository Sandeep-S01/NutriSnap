-- ScanFood Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Food entries table
create table if not exists food_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  food_name text not null,
  calories integer not null default 0,
  protein numeric(6,1) not null default 0,
  carbs numeric(6,1) not null default 0,
  fat numeric(6,1) not null default 0,
  fiber numeric(6,1) default 0,
  vitamins jsonb default '{}',
  image_url text,
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for fast daily queries
create index if not exists idx_food_entries_scanned_at on food_entries(scanned_at desc);
create index if not exists idx_food_entries_user_id on food_entries(user_id);

-- Row Level Security (enable for multi-user)
alter table food_entries enable row level security;

-- Policy: users can only see their own entries
-- (Remove/comment these if you want a shared demo without auth)
create policy "Users can view own entries" on food_entries
  for select using (auth.uid() = user_id OR user_id is null);

create policy "Users can insert own entries" on food_entries
  for insert with check (auth.uid() = user_id OR user_id is null);

create policy "Users can delete own entries" on food_entries
  for delete using (auth.uid() = user_id OR user_id is null);

-- ─── Profiles, Settings, and Goals Tables ────────────────────────────────────

-- Profiles table extending auth.users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- User settings table
create table if not exists public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  theme text not null default 'dark',
  demo_mode_enabled boolean not null default false,
  updated_at timestamptz default now()
);

-- User goals table
create table if not exists public.user_goals (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  daily_calories integer not null default 2000,
  daily_protein numeric(6,1) not null default 150.0,
  daily_carbs numeric(6,1) not null default 250.0,
  daily_fat numeric(6,1) not null default 65.0,
  daily_fiber numeric(6,1) not null default 38.0,
  updated_at timestamptz default now()
);

-- Index user tables
create index if not exists idx_profiles_email on profiles(email);

-- Enable RLS for user profiles
alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table user_goals enable row level security;

-- Policies for profiles
create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Policies for user_settings
create policy "Users can view their own settings" on user_settings
  for select using (auth.uid() = user_id);

create policy "Users can update their own settings" on user_settings
  for update using (auth.uid() = user_id);

-- Policies for user_goals
create policy "Users can view their own goals" on user_goals
  for select using (auth.uid() = user_id);

create policy "Users can update their own goals" on user_goals
  for update using (auth.uid() = user_id);

-- Trigger to automatically create profile, settings, and goals on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name'),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_settings (user_id)
  values (new.id);

  insert into public.user_goals (user_id)
  values (new.id);

  return new;
exception
  when others then
    return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Storage Configurations ──────────────────────────────────────────────────

-- Create public storage bucket for food scans
insert into storage.buckets (id, name, public)
values ('food-images', 'food-images', true)
on conflict (id) do nothing;

-- Storage Policy: Allow public read access to food scans
create policy "Allow public read access to food scans" on storage.objects
  for select using (bucket_id = 'food-images');

-- Storage Policy: Allow users to upload scans (authenticated or anonymous for demo)
create policy "Allow users to upload food scans" on storage.objects
  for insert with check (bucket_id = 'food-images');

-- Storage Policy: Allow users to delete scans
create policy "Allow users to delete food scans" on storage.objects
  for delete using (bucket_id = 'food-images');

-- ─── Nutrition Engine Tables ─────────────────────────────────────────────────

-- Foods database table
create table if not exists public.foods (
  id uuid default uuid_generate_v4() primary key,
  food_name text not null unique,
  description text,
  calories integer not null default 0,
  protein numeric(6,1) not null default 0,
  carbs numeric(6,1) not null default 0,
  fat numeric(6,1) not null default 0,
  fiber numeric(6,1) not null default 0,
  sugar numeric(6,1) not null default 0,
  sodium numeric(8,1) not null default 0,      -- mg
  potassium numeric(8,1) not null default 0,   -- mg
  iron numeric(6,1) not null default 0,        -- mg
  vitamin_a numeric(6,1) not null default 0,   -- mcg
  vitamin_b numeric(6,1) not null default 0,   -- mg
  vitamin_c numeric(6,1) not null default 0,   -- mg
  vitamin_d numeric(6,1) not null default 0,   -- mcg
  created_at timestamptz default now()
);

-- Food servings configurations
create table if not exists public.food_servings (
  id uuid default uuid_generate_v4() primary key,
  food_id uuid references public.foods(id) on delete cascade not null,
  serving_size numeric(6,1) not null default 100.0,
  serving_unit text not null default 'g',
  calories_per_serving integer not null default 0,
  protein_per_serving numeric(6,1) not null default 0,
  carbs_per_serving numeric(6,1) not null default 0,
  fat_per_serving numeric(6,1) not null default 0,
  created_at timestamptz default now()
);

-- Daily reference standards
create table if not exists public.nutrition_reference (
  id uuid default uuid_generate_v4() primary key,
  nutrient_name text not null unique,
  recommended_daily_value numeric(8,1) not null,
  unit text not null,
  description text
);

-- Indexes for fast lookups
create index if not exists idx_foods_name on foods(food_name);
create index if not exists idx_food_servings_food_id on food_servings(food_id);

-- Enable RLS
alter table foods enable row level security;
alter table food_servings enable row level security;
alter table nutrition_reference enable row level security;

-- Public read policies
create policy "Allow public read access to foods" on foods
  for select using (true);

create policy "Allow public read access to servings" on food_servings
  for select using (true);

create policy "Allow public read access to references" on nutrition_reference
  for select using (true);

-- Seed static reference meals
insert into public.foods (food_name, description, calories, protein, carbs, fat, fiber, sugar, sodium, potassium, iron, vitamin_a, vitamin_b, vitamin_c, vitamin_d)
values 
  ('Avocado Toast with Poached Egg', 'Toasted sourdough topped with smashed avocado, a poached egg, chili flakes, and microgreens.', 410, 18, 36, 22, 7, 3, 420, 580, 3.2, 28, 1.2, 8, 3),
  ('Grilled Chicken Caesar Salad', 'Romaine lettuce with grilled chicken breast, parmesan shavings, croutons, and Caesar dressing.', 380, 42, 18, 16, 4, 2, 780, 440, 2.8, 960, 0.8, 24, 1),
  ('Margherita Pizza (2 slices)', 'Classic Neapolitan pizza with tomato sauce, fresh mozzarella, and basil leaves.', 560, 22, 68, 20, 3, 5, 890, 310, 3.5, 240, 0.4, 8, 0.5),
  ('Acai Smoothie Bowl', 'Blended acai topped with granola, banana slices, mixed berries, and honey drizzle.', 480, 9, 82, 14, 11, 38, 85, 680, 2.1, 48, 1.8, 48, 0),
  ('Salmon Teriyaki Bowl', 'Pan-seared salmon fillet with steamed rice, edamame, cucumber, and teriyaki glaze.', 620, 48, 58, 18, 5, 12, 920, 840, 4.2, 54, 4.2, 2, 18),
  ('Greek Yogurt Parfait', 'Layered Greek yogurt with wild blueberries, strawberries, walnuts, and a drizzle of honey.', 320, 24, 38, 8, 4, 22, 95, 520, 1.4, 110, 1.4, 22, 3),
  ('Quinoa & Roasted Veggie Bowl', 'Fluffy quinoa with roasted sweet potato, chickpeas, red onion, and tahini dressing.', 490, 18, 72, 14, 13, 8, 320, 710, 4.8, 540, 1.5, 18, 0),
  ('Beef Burger with Fries', 'Juicy beef patty in a brioche bun with lettuce, tomato, cheese, and a side of crispy fries.', 860, 38, 88, 40, 6, 9, 1150, 740, 5.2, 120, 3.8, 4, 0.2)
on conflict (food_name) do update set
  description = excluded.description,
  calories = excluded.calories,
  protein = excluded.protein,
  carbs = excluded.carbs,
  fat = excluded.fat,
  fiber = excluded.fiber,
  sugar = excluded.sugar,
  sodium = excluded.sodium,
  potassium = excluded.potassium,
  iron = excluded.iron,
  vitamin_a = excluded.vitamin_a,
  vitamin_b = excluded.vitamin_b,
  vitamin_c = excluded.vitamin_c,
  vitamin_d = excluded.vitamin_d;

-- ─── Weight Tracking Configurations ──────────────────────────────────────────

-- Extend user_goals table to support target weights
alter table public.user_goals add column if not exists target_weight numeric(5,1) default 70.0;

-- Weight log tracker table
create table if not exists public.weight_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  weight numeric(5,1) not null, -- kg or lbs
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for ordering logs
create index if not exists idx_weight_logs_logged_at on weight_logs(logged_at desc);

-- Enable RLS for weight logs
alter table weight_logs enable row level security;

-- Policies: allow users to query and log their own weights
create policy "Users can view own weight logs" on weight_logs
  for select using (auth.uid() = user_id OR user_id is null);

create policy "Users can insert own weight logs" on weight_logs
  for insert with check (auth.uid() = user_id OR user_id is null);

create policy "Users can delete own weight logs" on weight_logs
  for delete using (auth.uid() = user_id OR user_id is null);

-- ─── Water Tracking Configurations ────────────────────────────────────────────

-- Extend user_goals table to support daily water intake target (ml)
alter table public.user_goals add column if not exists daily_water integer default 2500;

-- Water log tracker table
create table if not exists public.water_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount_ml integer not null default 0,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for ordering logs
create index if not exists idx_water_logs_logged_at on water_logs(logged_at desc);

-- Enable RLS for water logs
alter table water_logs enable row level security;

-- Policies: allow users to query and log their own water logs
create policy "Users can view own water logs" on water_logs
  for select using (auth.uid() = user_id OR user_id is null);

create policy "Users can insert own water logs" on water_logs
  for insert with check (auth.uid() = user_id OR user_id is null);

create policy "Users can delete own water logs" on water_logs
  for delete using (auth.uid() = user_id OR user_id is null);

-- ─── Notifications Configurations ───────────────────────────────────────────

-- Notifications table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info', -- 'info', 'success', 'warning'
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for ordering notifications
create index if not exists idx_notifications_created_at on notifications(created_at desc);

-- Enable RLS for notifications
alter table notifications enable row level security;

-- Policies
create policy "Users can view own notifications" on notifications
  for select using (auth.uid() = user_id OR user_id is null);

create policy "Users can insert own notifications" on notifications
  for insert with check (auth.uid() = user_id OR user_id is null);

create policy "Users can update own notifications" on notifications
  for update using (auth.uid() = user_id OR user_id is null);

create policy "Users can delete own notifications" on notifications
  for delete using (auth.uid() = user_id OR user_id is null);
