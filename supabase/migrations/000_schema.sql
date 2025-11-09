create extension if not exists "uuid-ossp";
create table if not exists users ( id uuid primary key default uuid_generate_v4(), email text unique, full_name text );
create table if not exists groups ( id uuid primary key default uuid_generate_v4(), name text not null, contribution_amount numeric(12,2) not null default 0 );
create table if not exists memberships ( group_id uuid references groups(id) on delete cascade, user_id uuid references users(id) on delete cascade, role text default 'member', is_active boolean default true, primary key (group_id, user_id) );
create table if not exists payout_order ( group_id uuid references groups(id) on delete cascade, user_id uuid references users(id) on delete cascade, cycle_ordinal int not null, primary key (group_id, user_id) );
create table if not exists cycles ( group_id uuid references groups(id) on delete cascade, ordinal int not null, payout_date date not null, primary key (group_id, ordinal) );
create table if not exists installments ( id uuid primary key default uuid_generate_v4(), group_id uuid references groups(id) on delete cascade, cycle_ordinal int not null, from_user_id uuid references users(id), to_user_id uuid references users(id), due_date date not null, amount numeric(12,2) not null, status text not null default 'due', method text, cash_note text );
create table if not exists invitations ( id uuid primary key default uuid_generate_v4(), group_id uuid references groups(id) on delete cascade, code text unique, email text, created_at timestamptz default now() );
