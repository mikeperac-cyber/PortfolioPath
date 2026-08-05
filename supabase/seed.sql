-- Local demo password for every account: Portfolio123!
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000001','authenticated','authenticated','student@demo.portfoliopath.example.com',crypt('Portfolio123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"role":"student","full_name":"Elif Aydın","locale":"en"}',now(),now()),
('00000000-0000-0000-0000-000000000000','20000000-0000-0000-0000-000000000001','authenticated','authenticated','counselor@demo.portfoliopath.example.com',crypt('Portfolio123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"role":"counselor","full_name":"Ayşe Demir","locale":"en"}',now(),now()),
('00000000-0000-0000-0000-000000000000','30000000-0000-0000-0000-000000000001','authenticated','authenticated','admin@demo.portfoliopath.example.com',crypt('Portfolio123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"role":"student","full_name":"Platform Admin","locale":"en"}',now(),now());

-- GoTrue scans legacy token columns as strings during password login. Directly
-- seeded users must use empty strings rather than null for these fields.
update auth.users
set confirmation_token = '', recovery_token = '', email_change_token_new = '', email_change = ''
where id in (
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001'
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id, id, email, jsonb_build_object('sub',id::text,'email',email), 'email', now(), now(), now() from auth.users where id in ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');

update public.users set role='administrator', status='active' where id='30000000-0000-0000-0000-000000000001';
update public.users set status='active' where id='20000000-0000-0000-0000-000000000001';
update public.counselor_profiles set verified_at=now(), organization='Independent Education Counseling', title='University Admissions Counselor' where user_id='20000000-0000-0000-0000-000000000001';
update public.student_profiles set age=17, school_year='Grade 11', city='Istanbul', country='Türkiye', target_application_year=2027, intended_destinations=array['United Kingdom','Netherlands'], intended_major='Environmental Science', personal_interests=array['Diving','Marine life','Photography'], weekly_hours=4, budget_try=1000, onboarding_step=8, onboarding_completed=true where user_id='10000000-0000-0000-0000-000000000001';

insert into public.plans(id,code,name_en,name_tr,price_try,billing_interval,entitlements,sort_order) values
('40000000-0000-0000-0000-000000000001','free','Free Assessment','Ücretsiz Değerlendirme',0,'free','{"idea_count":1,"project_limit":0}',1),
('40000000-0000-0000-0000-000000000002','blueprint','Project Blueprint','Proje Yol Haritası',1200,'one_time','{"idea_count":3,"project_limit":1,"download_plan":true}',2),
('40000000-0000-0000-0000-000000000003','complete','Complete Student Portfolio','Tam Öğrenci Portföyü',5500,'one_time','{"idea_count":3,"project_limit":3,"workspace":true,"evidence":true,"reflections":true,"portfolio":true,"pdf":true}',3),
('40000000-0000-0000-0000-000000000004','counselor','Counselor Professional','Profesyonel Danışman',2500,'month','{"student_limit":25,"reviews":true,"templates":true,"progress_summaries":true}',4);

insert into public.subscriptions(user_id,plan_id,status,provider) values
('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000003','active','test'),
('20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000004','active','test');

insert into public.counselor_student_assignments(counselor_id,student_id,assigned_by) values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');

insert into public.project_categories(id,slug,name_en,name_tr,description_en,description_tr,sort_order) values
('50000000-0000-0000-0000-000000000001','travel-culture','Travel and cultural exploration','Seyahat ve kültürel keşif','Document place-based learning.','Yer temelli öğrenmeyi belgele.',1),
('50000000-0000-0000-0000-000000000002','coding','Coding and technology','Kodlama ve teknoloji','Build and document useful technology.','Faydalı teknoloji geliştir ve belgele.',2),
('50000000-0000-0000-0000-000000000003','sports','Sports','Spor','Document training, leadership, or analysis.','Antrenman, liderlik veya analizi belgele.',3),
('50000000-0000-0000-0000-000000000004','environment','Environmental action','Çevresel eylem','Measure and document responsible action.','Sorumlu eylemi ölç ve belgele.',4),
('50000000-0000-0000-0000-000000000005','research','Research','Araştırma','Complete a small, ethical research study.','Küçük ve etik bir araştırma yap.',5);

insert into public.skills(id,slug,name_en,name_tr) values
('60000000-0000-0000-0000-000000000001','research','Research','Araştırma'),
('60000000-0000-0000-0000-000000000002','communication','Communication','İletişim'),
('60000000-0000-0000-0000-000000000003','initiative','Initiative','İnisiyatif'),
('60000000-0000-0000-0000-000000000004','resilience','Resilience','Dayanıklılık'),
('60000000-0000-0000-0000-000000000005','coding','Coding','Kodlama'),
('60000000-0000-0000-0000-000000000006','data-analysis','Data analysis','Veri analizi'),
('60000000-0000-0000-0000-000000000007','leadership','Leadership','Liderlik'),
('60000000-0000-0000-0000-000000000008','writing','Writing','Yazma');

insert into public.project_templates(category_id,title_en,title_tr,summary_en,summary_tr,intended_major_tags,suggested_duration_weeks,suggested_weekly_hours,estimated_cost_try,template_data,ethical_notes) values
('50000000-0000-0000-0000-000000000001','Marine Observation Log from a Diving Trip','Dalış Gezisi Deniz Gözlem Günlüğü','Turn genuine diving observations into a documented field log.','Gerçek dalış gözlemlerini belgeli bir saha günlüğüne dönüştür.',array['Environmental Science','Marine Biology'],6,4,500,'{"deliverable":"Illustrated observation report","evidence":["field notes","photos","species log"]}','{"privacy":"Do not reveal sensitive species locations.","claims":"Separate observation from scientific conclusion."}'),
('50000000-0000-0000-0000-000000000002','Local Tourism Website','Yerel Turizm Web Sitesi','Build an accessible local guide and document user testing.','Erişilebilir bir yerel rehber geliştir ve kullanıcı testini belgele.',array['Computer Science','Tourism'],8,4,750,'{"deliverable":"Deployed bilingual website"}','{"claims":"Do not invent visitor numbers or partnerships."}'),
('50000000-0000-0000-0000-000000000003','Sports Leadership Documentation','Spor Liderliği Belgeleme','Document a genuine training or peer-support initiative.','Gerçek bir antrenman veya akran desteği girişimini belgele.',array['Sports Science','Psychology'],6,3,250,'{"deliverable":"Leadership evidence portfolio"}','{"claims":"Do not invent captaincy or participant outcomes."}'),
('50000000-0000-0000-0000-000000000004','Environmental Awareness Audit','Çevre Farkındalığı Denetimi','Observe a local issue and test one measurable intervention.','Yerel bir sorunu gözlemle ve ölçülebilir bir müdahaleyi test et.',array['Environmental Science'],6,3,400,'{"deliverable":"Evidence-backed findings brief"}','{"claims":"Report observed data, not city-wide impact."}'),
('50000000-0000-0000-0000-000000000005','Small Student Research Study','Küçük Öğrenci Araştırması','Design and complete a feasible ethical study.','Uygulanabilir ve etik bir araştırma tasarla ve tamamla.',array['Social Sciences','Biology'],8,4,300,'{"deliverable":"Research poster and methods appendix"}','{"privacy":"Use consent and anonymize participants."}');

insert into public.projects(id,student_id,category_id,title,personal_motivation,problem_opportunity,main_objective,target_audience,start_date,end_date,weekly_hours,risks,alternative_plan,final_deliverable,status,factual_accuracy_confirmed_at) values
('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Marine Observation Log from a Diving Trip','Diving made me curious about how marine environments change between locations.','My observations existed only as photos and memories.','Create a structured, evidence-backed observation log without presenting observations as scientific proof.','Students interested in marine environments','2026-07-20','2026-08-30',4,'Weather and limited dive access','Use existing consented photographs and publicly available identification guides.','Illustrated marine observation report','active',now()),
('70000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','Local Tourism Website Coding Project','I want to connect coding with local culture.','Small local places lack concise bilingual information.','Build and test an accessible bilingual guide.','International visitors',null,null,3,'Limited interviews','Use public municipal information and cite sources.','Responsive website prototype','draft',null),
('70000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','Sports Leadership Documentation Project','I support younger players during practice.','The support work is real but undocumented.','Document specific peer-support actions and feedback.','Youth team members',null,null,2,'Schedule changes','Document individual training preparation instead.','Factual leadership case study','draft',null),
('70000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000004','Environmental Awareness Project','I care about waste near the coast.','Litter patterns are visible but not measured.','Run a small observation audit and one awareness test.','Local students',null,null,3,'Unsafe collection areas','Observe from safe public paths only.','Data-backed awareness brief','draft',null),
('70000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000005','Small Student Research Project','I want to learn how research questions become evidence.','I need a feasible first study.','Complete a small anonymous survey and reflect on limitations.','High-school students',null,null,3,'Low response count','Use a smaller qualitative document analysis.','Research poster','draft',null);

insert into public.project_outcomes(project_id,description,target_value,sort_order) values
('70000000-0000-0000-0000-000000000001','Complete observation logs','4 dive locations',1),
('70000000-0000-0000-0000-000000000001','Identify observations with cited guides','12 observations',2),
('70000000-0000-0000-0000-000000000001','Publish a reviewed report','1 report',3);

insert into public.project_weeks(id,project_id,week_number,milestone,starts_on,ends_on) values
('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',1,'Define observation method and evidence plan','2026-07-20','2026-07-26'),
('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001',2,'Organize field notes and consented photographs','2026-07-27','2026-08-02'),
('80000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000001',3,'Identify patterns and document uncertainty','2026-08-03','2026-08-09');

insert into public.tasks(project_id,week_id,title,description,due_at,priority,estimated_minutes,actual_minutes,status) values
('70000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','Upload underwater photos and field notes','Add only images you created or have permission to use.','2026-08-05 18:00+03','high',60,null,'in_progress'),
('70000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','Record water temperature and visibility data','Transcribe measurements from the original log.','2026-08-06 18:00+03','medium',45,35,'complete'),
('70000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','Write reflection: patterns in marine life','Use concrete observations and name uncertainty.','2026-08-08 18:00+03','medium',40,null,'not_started');

insert into public.evidence(id,project_id,student_id,week_id,skill_id,title,description,evidence_type,external_url,mime_type,size_bytes,student_explanation,review_status,privacy) values
('a0000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000001','Annotated field observation log','Dated observation notes with uncertainty labels.','document','https://example.com/demo/annotated-field-log','application/pdf',184320,'I created this log from my own observation notes and identified uncertain entries.','accepted','portfolio_selected'),
('a0000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000006','Site conditions photograph','Photograph used to document visibility and location context.','image','https://example.com/demo/site-conditions','image/jpeg',524288,'I took this image and need to add exact conditions before portfolio use.','clarification_requested','private'),
('a0000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000008','Observation spreadsheet','Structured transcription of dates, conditions, and observations.','spreadsheet','https://example.com/demo/observation-sheet','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',92160,'I transcribed measurements from my original field notes.','pending','private');

insert into public.project_skills(project_id,skill_id,status) values
('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','evidence_supported'),
('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000006','target'),
('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000008','target');

insert into public.reflections(project_id,student_id,week_id,reflection_type,responses,narrative,submitted_at) values
('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002','weekly','{"completed":"Organized field notes by location.","difficult":"Some species could not be identified confidently.","next":"Record uncertainty and cite the guide used."}','I learned that an observation and a conclusion are not the same thing.',now());

insert into public.portfolio_pages(id,project_id,student_id,title,status,confirmed_at) values('90000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Marine Observation Log from a Diving Trip','ready',now());
insert into public.portfolio_sections(portfolio_page_id,section_type,title,content,sort_order) values
('90000000-0000-0000-0000-000000000001','summary','Project summary','{"text":"A documented field-observation project based on genuine diving experiences."}',1),
('90000000-0000-0000-0000-000000000001','motivation','Personal motivation','{"text":"Diving made me curious about variation between marine environments."}',2),
('90000000-0000-0000-0000-000000000001','actions','Actions completed','{"items":["Defined an observation method","Organized field notes","Recorded measurement context"]}',3),
('90000000-0000-0000-0000-000000000001','reflection','Reflection','{"text":"I learned to distinguish observation, identification, and conclusion."}',4);
