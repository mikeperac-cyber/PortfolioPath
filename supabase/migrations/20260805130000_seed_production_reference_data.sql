-- Production reference data for PortfolioPath.
-- This migration intentionally excludes demo users, demo projects, demo evidence,
-- subscriptions, assignments, and any student-authored content.

insert into public.plans (
  code,
  name_en,
  name_tr,
  price_try,
  billing_interval,
  entitlements,
  active,
  sort_order
)
values
  (
    'free',
    'Free Assessment',
    'Ücretsiz Değerlendirme',
    0,
    'free',
    '{"idea_count": 1, "project_limit": 0}'::jsonb,
    true,
    1
  ),
  (
    'blueprint',
    'Project Blueprint',
    'Proje Yol Haritası',
    1200,
    'one_time',
    '{"idea_count": 3, "project_limit": 1, "download_plan": true}'::jsonb,
    true,
    2
  ),
  (
    'complete',
    'Complete Student Portfolio',
    'Tam Öğrenci Portföyü',
    5500,
    'one_time',
    '{"idea_count": 3, "project_limit": 3, "workspace": true, "evidence": true, "reflections": true, "portfolio": true, "pdf": true}'::jsonb,
    true,
    3
  ),
  (
    'counselor',
    'Counselor Professional',
    'Profesyonel Danışman',
    2500,
    'month',
    '{"student_limit": 25, "reviews": true, "templates": true, "progress_summaries": true}'::jsonb,
    true,
    4
  )
on conflict (code) do update
set
  name_en = excluded.name_en,
  name_tr = excluded.name_tr,
  price_try = excluded.price_try,
  billing_interval = excluded.billing_interval,
  entitlements = excluded.entitlements,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into public.project_categories (
  slug,
  name_en,
  name_tr,
  description_en,
  description_tr,
  active,
  sort_order
)
values
  (
    'travel-culture',
    'Travel and cultural exploration',
    'Seyahat ve kültürel keşif',
    'Document place-based learning.',
    'Yer temelli öğrenmeyi belgele.',
    true,
    1
  ),
  (
    'coding',
    'Coding and technology',
    'Kodlama ve teknoloji',
    'Build and document useful technology.',
    'Faydalı teknoloji geliştir ve belgele.',
    true,
    2
  ),
  (
    'sports',
    'Sports',
    'Spor',
    'Document training, leadership, or analysis.',
    'Antrenman, liderlik veya analizi belgele.',
    true,
    3
  ),
  (
    'environment',
    'Environmental action',
    'Çevresel eylem',
    'Measure and document responsible action.',
    'Sorumlu eylemi ölç ve belgele.',
    true,
    4
  ),
  (
    'research',
    'Research',
    'Araştırma',
    'Complete a small, ethical research study.',
    'Küçük ve etik bir araştırma yap.',
    true,
    5
  )
on conflict (slug) do update
set
  name_en = excluded.name_en,
  name_tr = excluded.name_tr,
  description_en = excluded.description_en,
  description_tr = excluded.description_tr,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into public.skills (
  slug,
  name_en,
  name_tr
)
values
  ('research', 'Research', 'Araştırma'),
  ('communication', 'Communication', 'İletişim'),
  ('initiative', 'Initiative', 'İnisiyatif'),
  ('resilience', 'Resilience', 'Dayanıklılık'),
  ('coding', 'Coding', 'Kodlama'),
  ('data-analysis', 'Data analysis', 'Veri analizi'),
  ('leadership', 'Leadership', 'Liderlik'),
  ('writing', 'Writing', 'Yazma')
on conflict (slug) do update
set
  name_en = excluded.name_en,
  name_tr = excluded.name_tr;

with template_rows as (
  select
    'travel-culture'::text as category_slug,
    'Marine Observation Log from a Diving Trip'::text as title_en,
    'Dalış Gezisi Deniz Gözlem Günlüğü'::text as title_tr,
    'Turn genuine diving observations into a documented field log.'::text as summary_en,
    'Gerçek dalış gözlemlerini belgeli bir saha günlüğüne dönüştür.'::text as summary_tr,
    array['Environmental Science', 'Marine Biology']::text[] as intended_major_tags,
    6::integer as suggested_duration_weeks,
    4::numeric(4,1) as suggested_weekly_hours,
    500::integer as estimated_cost_try,
    '{"deliverable": "Illustrated observation report", "evidence": ["field notes", "photos", "species log"]}'::jsonb as template_data,
    '{"privacy": "Do not reveal sensitive species locations.", "claims": "Separate observation from scientific conclusion."}'::jsonb as ethical_notes
  union all
  select
    'coding',
    'Local Tourism Website',
    'Yerel Turizm Web Sitesi',
    'Build an accessible local guide and document user testing.',
    'Erişilebilir bir yerel rehber geliştir ve kullanıcı testini belgele.',
    array['Computer Science', 'Tourism']::text[],
    8,
    4::numeric(4,1),
    750,
    '{"deliverable": "Deployed bilingual website"}'::jsonb,
    '{"claims": "Do not invent visitor numbers or partnerships."}'::jsonb
  union all
  select
    'sports',
    'Sports Leadership Documentation',
    'Spor Liderliği Belgeleme',
    'Document a genuine training or peer-support initiative.',
    'Gerçek bir antrenman veya akran desteği girişimini belgele.',
    array['Sports Science', 'Psychology']::text[],
    6,
    3::numeric(4,1),
    250,
    '{"deliverable": "Leadership evidence portfolio"}'::jsonb,
    '{"claims": "Do not invent captaincy or participant outcomes."}'::jsonb
  union all
  select
    'environment',
    'Environmental Awareness Audit',
    'Çevre Farkındalığı Denetimi',
    'Observe a local issue and test one measurable intervention.',
    'Yerel bir sorunu gözlemle ve ölçülebilir bir müdahaleyi test et.',
    array['Environmental Science']::text[],
    6,
    3::numeric(4,1),
    400,
    '{"deliverable": "Evidence-backed findings brief"}'::jsonb,
    '{"claims": "Report observed data, not city-wide impact."}'::jsonb
  union all
  select
    'research',
    'Small Student Research Study',
    'Küçük Öğrenci Araştırması',
    'Design and complete a feasible ethical study.',
    'Uygulanabilir ve etik bir araştırma tasarla ve tamamla.',
    array['Social Sciences', 'Biology']::text[],
    8,
    4::numeric(4,1),
    300,
    '{"deliverable": "Research poster and methods appendix"}'::jsonb,
    '{"privacy": "Use consent and anonymize participants."}'::jsonb
)
insert into public.project_templates (
  category_id,
  title_en,
  title_tr,
  summary_en,
  summary_tr,
  intended_major_tags,
  suggested_duration_weeks,
  suggested_weekly_hours,
  estimated_cost_try,
  template_data,
  ethical_notes,
  active
)
select
  c.id,
  tr.title_en,
  tr.title_tr,
  tr.summary_en,
  tr.summary_tr,
  tr.intended_major_tags,
  tr.suggested_duration_weeks,
  tr.suggested_weekly_hours,
  tr.estimated_cost_try,
  tr.template_data,
  tr.ethical_notes,
  true
from template_rows tr
join public.project_categories c on c.slug = tr.category_slug
where not exists (
  select 1
  from public.project_templates existing
  where existing.title_en = tr.title_en
);
