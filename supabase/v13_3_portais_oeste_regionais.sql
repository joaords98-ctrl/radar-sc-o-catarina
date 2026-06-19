-- Radar SC v13.3 — Portais Oeste/Regionais
-- Adiciona portais pedidos pelo usuário para ampliar cobertura do Oeste e notícias regionais de SC.

insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('Oeste Mais','oestemais.com',null,'Oeste/Meio-Oeste','Portal regional','portal',5,true,'Fonte regional para Oeste catarinense, rodovias, política, segurança e serviços'),
('Click Xaxim','clickxaxim.com.br',null,'Xaxim/Oeste','Portal regional','portal',4,true,'Fonte local para Xaxim e Oeste de SC'),
('Nova FM 103','novafm103.com.br',null,'Oeste','Rádio/portal regional','portal',4,true,'Rádio e portal regional com notícias do Oeste catarinense'),
('DI Regional','diregional.com.br',null,'SC/Regional','Portal regional','portal',4,true,'Portal regional de notícias de Santa Catarina'),
('ClicRDC','clicrdc.com.br','@clicrdc','Chapecó/Oeste','Portal regional','portal',5,true,'Fonte forte no Oeste catarinense e Chapecó'),
('Agência ICEM','agenciaicem.com.br',null,'SC/Regional','Agência/portal regional','portal',4,true,'Agência regional para monitoramento de notícias catarinenses')
on conflict (domain) do update set
  name = excluded.name,
  instagram_handle = excluded.instagram_handle,
  region = excluded.region,
  category = excluded.category,
  source_type = excluded.source_type,
  priority_weight = excluded.priority_weight,
  is_competitor = excluded.is_competitor,
  notes = excluded.notes;

-- Evita duplicar consultas se o arquivo for rodado mais de uma vez.
delete from rss_queries where label like 'V13.3 Portal%';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V13.3 Portal Oeste Mais Geral','site:oestemais.com Santa Catarina OR SC OR Oeste OR Chapecó OR Concórdia OR Xanxerê','Radar Oeste',null,'Oeste',5,true),
('V13.3 Portal Oeste Mais Rodovias','site:oestemais.com acidente OR rodovia OR SC-155 OR BR-282 OR BR-153 OR Oeste Santa Catarina','Trânsito/Rodovias',null,'Oeste',5,true),
('V13.3 Portal Oeste Mais Política','site:oestemais.com prefeitura OR vereador OR deputado OR governo OR eleição OR política Santa Catarina','Política',null,'Oeste',4,true),
('V13.3 Portal Click Xaxim','site:clickxaxim.com.br Xaxim OR Oeste OR Santa Catarina OR SC','Radar Local','Xaxim','Oeste',4,true),
('V13.3 Portal Click Xaxim Segurança','site:clickxaxim.com.br polícia OR acidente OR bombeiros OR rodovia Xaxim Santa Catarina','Segurança Pública','Xaxim','Oeste',4,true),
('V13.3 Portal Nova FM 103','site:novafm103.com.br/noticias Oeste OR Santa Catarina OR SC OR Chapecó OR Maravilha OR Pinhalzinho','Radar Oeste',null,'Oeste',4,true),
('V13.3 Portal Nova FM 103 Serviços','site:novafm103.com.br/noticias prefeitura OR saúde OR educação OR Defesa Civil Santa Catarina','Serviços Públicos',null,'Oeste',4,true),
('V13.3 Portal DI Regional','site:diregional.com.br Santa Catarina OR SC OR Oeste OR política OR segurança','Radar Regional',null,'SC',4,true),
('V13.3 Portal ClicRDC','site:clicrdc.com.br Chapecó OR Oeste OR Santa Catarina OR SC','Radar Oeste','Chapecó','Oeste',5,true),
('V13.3 Portal ClicRDC Segurança','site:clicrdc.com.br polícia OR acidente OR bombeiros OR rodovia Chapecó Oeste Santa Catarina','Segurança Pública','Chapecó','Oeste',5,true),
('V13.3 Portal ClicRDC Política','site:clicrdc.com.br prefeitura OR governo OR vereador OR deputado OR política Santa Catarina','Política','Chapecó','Oeste',4,true),
('V13.3 Portal Agência ICEM','site:agenciaicem.com.br Santa Catarina OR SC OR política OR segurança OR Oeste','Radar Regional',null,'SC',4,true),
('V13.3 Portal Oeste Combo','(site:oestemais.com OR site:clickxaxim.com.br OR site:clicrdc.com.br OR site:novafm103.com.br) Santa Catarina OR Oeste OR Chapecó OR Xaxim OR Xanxerê OR Concórdia','Radar Oeste',null,'Oeste',5,true);
