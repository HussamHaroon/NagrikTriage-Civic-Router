-- ====================================================================
-- NagrikTriage — Supabase schema
-- Run this ONCE in the Supabase SQL editor
-- (Project → SQL Editor → New query → paste → Run)
-- ====================================================================

-- Tickets: every complaint triaged by the AI is stored here. The officer
-- dashboard and mayor dashboard both query this table (filtered), and the
-- citizen history can too.

create table if not exists public.tickets (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  ticket_id       text unique not null,                 -- NT-DEL-2026-12345
  city_id         text,                                 -- 'delhi' | 'mumbai' | ... | 'other'
  city_hint       text,                                 -- free-form city label
  original_text   text,
  had_image       boolean not null default false,
  core_issue      text not null,
  target_department text not null,
  urgency_score   int  not null check (urgency_score between 1 and 10),
  formal_draft    text not null,
  next_step       text not null,
  signals         text[] not null default '{}',
  incident_kind   text not null default 'other',
  confidence_score real not null default 0.7,
  status          text not null default 'filed'        -- filed | ack | assigned | progress | resolved
);

create index if not exists tickets_city_id_idx on public.tickets (city_id);
create index if not exists tickets_incident_kind_idx on public.tickets (incident_kind);
create index if not exists tickets_urgency_idx on public.tickets (urgency_score desc);
create index if not exists tickets_created_at_idx on public.tickets (created_at desc);

-- Seed a few demo tickets so officer/mayor dashboards look populated even
-- before real citizens file anything. These are simulated municipal issues
-- with synthetic coordinates inside each metro's bounding box.

insert into public.tickets
  (ticket_id, city_id, core_issue, target_department, urgency_score, formal_draft, next_step, signals, incident_kind, confidence_score)
values
  ('NT-DEL-2026-10001', 'delhi', 'Burst water main', 'Delhi Jal Board', 9,
   'To the Executive Engineer, Delhi Jal Board: A burst water main on Linking Road near Lajpat Nagar is flooding the footpath and disrupting traffic for the last 6 hours. Immediate shutoff and repair is requested.',
   'Call DJB helpline 1916 and report exact landmark.',
   array['water main burst','traffic disruption','6 hours ongoing'], 'water', 0.94),

  ('NT-DEL-2026-10002', 'delhi', 'Garbage pile up', 'Municipal Corporation of Delhi', 5,
   'To the Sanitation Officer, MCD: An uncollected garbage pile on 5th Avenue Road near the community park is causing foul smell and attracting stray dogs.',
   'Log a sanitation ticket on the MCD portal.',
   array['garbage 7 days','park nearby','stray dogs'], 'sanitation', 0.86),

  ('NT-MUM-2026-20001', 'mumbai', 'Power outage 3 days', 'BEST / Adani Electricity', 8,
   'To the Zonal Engineer, Adani Electricity Mumbai: Ward F-North has experienced continuous power outage for the last 3 days, affecting residents including senior citizens and patients on home medical equipment.',
   'Call Adani helpline 19122 and request restoration timeline.',
   array['3 day outage','hospital patients','senior citizens'], 'power', 0.93),

  ('NT-MUM-2026-20002', 'mumbai', 'Pothole near school', 'BMC (Brihanmumbai Municipal Corporation)', 7,
   'To the Roads Department, BMC: A large pothole on SV Road near the primary school entrance is a safety hazard for schoolchildren arriving in the morning.',
   'Mark with reflective cones and schedule repair within 48 hours.',
   array['school zone','large pothole','morning rush'], 'roads', 0.9),

  ('NT-BLR-2026-30001', 'bengaluru', 'Water contamination', 'BWSSB', 10,
   'To the Engineer, BWSSB: Residents of Ward 82 (HSR Layout) report brown, foul-smelling water supply for the past 48 hours with multiple cases of stomach illness reported.',
   'Issue public boil-water advisory and test supply immediately.',
   array['contamination','illness reported','48 hours'], 'water', 0.96),

  ('NT-CHE-2026-40001', 'chennai', 'Streetlight outage', 'Greater Chennai Corporation', 4,
   'To the Electrical Wing, GCC: Streetlights on 4th Cross Street, T-Nagar have been non-functional for two weeks, making the area unsafe after dark.',
   'File a streetlight complaint on the GCC portal.',
   array['streetlight 14 days','unsafe at night'], 'streetlight', 0.88),

  ('NT-KOL-2026-50001', 'kolkata', 'Open manhole', 'Kolkata Municipal Corporation', 9,
   'To the Drainage Department, KMC: An open manhole without cover on Park Street near the bus stop is a serious safety hazard, especially at night.',
   'Place a barricade and cover immediately, then file a drainage complaint.',
   array['open manhole','bus stop','no barricade'], 'sanitation', 0.91),

  ('NT-HYD-2026-60001', 'hyderabad', 'Road cave-in', 'GHMC', 8,
   'To the Roads Department, GHMC: A section of road near Jubilee Hills Check Post has caved in creating a 4-foot crater, endangering two-wheeler riders.',
   'Cordon off the area and dispatch emergency repair.',
   array['road cave-in','4ft crater','two-wheeler risk'], 'roads', 0.92),

  ('NT-PUN-2026-70001', 'pune', 'Overflowing drainage', 'Pune Municipal Corporation', 6,
   'To the Drainage Wing, PMC: Overloaded drainage from recent rains is overflowing onto Sinhagad Road near the bus depot, causing traffic to slow.',
   'Request PMC drainage team to flush the affected stretch.',
   array['post-rain overflow','traffic slowdown'], 'sanitation', 0.85),

  ('NT-AHM-2026-80001', 'ahmedabad', 'Snapped electric wire', 'Torrent Power', 9,
   'To the Zonal Engineer, Torrent Power: A snapped low-hanging live electric wire on CG Road is sparking intermittently and accessible to passers-by.',
   'Cut power to the line and dispatch a lineman immediately.',
   array['live wire','sparking','pedestrian access'], 'power', 0.95),

  ('NT-DEL-2026-10003', 'delhi', 'Water contamination', 'Delhi Jal Board', 10,
   'To the Engineer, DJB: Several households in Rohini Sector 7 have reported foul-smelling water supply for 2 days, with 4 confirmed cases of stomach illness in the area.',
   'Issue advisory and test the source immediately.',
   array['contamination spike','4 illnesses','2 days'], 'water', 0.97),

  ('NT-DEL-2026-10004', 'delhi', 'Water contamination', 'Delhi Jal Board', 9,
   'To the Engineer, DJB: Pitampura residents report discoloration and bad odor in tap water for 24 hours. Local clinic has logged 6 cases of gastroenteritis.',
   'Test supply and issue boil-water advisory within 12 hours.',
   array['water contamination','6 GI cases','24 hours'], 'water', 0.93);

-- Optional: enable RLS but leave permissive policies so the demo works
-- without auth. Tighten before production.
alter table public.tickets enable row level security;

drop policy if exists "tickets demo read" on public.tickets;
create policy "tickets demo read" on public.tickets for select using (true);

drop policy if exists "tickets demo insert" on public.tickets;
create policy "tickets demo insert" on public.tickets for insert with check (true);