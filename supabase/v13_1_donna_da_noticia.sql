-- Radar SC v13.1 — Fonte Donna da Notícia
-- Adiciona o portal Donna da Notícia como fonte monitorada pelo Radar.

insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('Donna da Notícia','donnadanoticia.com.br','@donnadanoticia.com.br','Sul/Tubarão','Portal regional','portal',4,true,'Portal regional com cobertura de SC, Tubarão e região')
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
delete from rss_queries where label like 'V13.1 Donna%';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V13.1 Donna da Notícia Geral','site:donnadanoticia.com.br Santa Catarina OR SC OR Tubarão','Radar Local','Tubarão','Sul',5,true),
('V13.1 Donna da Notícia Segurança','site:donnadanoticia.com.br segurança polícia acidente rodovia Tubarão Santa Catarina','Segurança Pública','Tubarão','Sul',4,true),
('V13.1 Donna da Notícia Serviços','site:donnadanoticia.com.br prefeitura saúde educação Procon Defesa Civil Tubarão Santa Catarina','Serviços Públicos','Tubarão','Sul',4,true),
('V13.1 Donna da Notícia Política SC','site:donnadanoticia.com.br governo Jorginho prefeitura vereador deputado Santa Catarina','Política',null,'SC',4,true);
