-- Radar SC v13.2 — Portais estratégicos de Santa Catarina
-- Adiciona portais estaduais, regionais e nacionais com páginas/tags focadas em SC.

insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('NSC Total','nsctotal.com.br','@nsctotal','SC','Portal estadual','portal',5,true,'Portal estadual de alta relevância para SC'),
('G1','g1.globo.com','@g1','SC','Portal nacional/editoria SC','portal',5,true,'Editorias e notícias de Santa Catarina no G1'),
('Diarinho','diarinho.net','@jornaldiarinho','Itajaí/Litoral Norte','Portal regional','portal',5,true,'Forte no Litoral Norte, Itajaí e Balneário Camboriú'),
('Imagem da Ilha','imagemdailha.com.br','@imagemdailha','Grande Florianópolis','Portal regional','portal',4,true,'Cobertura de Florianópolis e região'),
('CNN Brasil','cnnbrasil.com.br','@cnnbrasil','SC/Nacional','Portal nacional','portal',4,true,'Tag e cobertura nacional sobre Santa Catarina'),
('SCC10','scc10.com.br','@portal.scc10','SC','Portal estadual','portal',5,true,'Portal estadual e TV com cobertura regional'),
('Santa Catarina em Pauta','santacatarinaempauta.com.br',null,'SC','Política/SC','portal',4,true,'Cobertura política e estadual'),
('GZH','gauchazh.clicrbs.com.br','@gauchazh','SC/RS','Portal regional/nacional','portal',3,true,'Tag de Santa Catarina no GZH'),
('Folha de S.Paulo','folha.uol.com.br',null,'SC/Nacional','Portal nacional','portal',3,true,'Tópicos de Santa Catarina na Folha'),
('RCN Online','rcnonline.com.br',null,'SC','Portal regional','portal',4,true,'Cobertura regional de Santa Catarina'),
('UOL Notícias','noticias.uol.com.br',null,'SC/Nacional','Portal nacional','portal',3,true,'Editorias e notícias de Santa Catarina no UOL'),
('Correio SC','correiosc.com.br',null,'SC','Portal regional','portal',4,true,'Portal regional catarinense'),
('Gazeta SBS','gazetasbs.com.br',null,'São Bento do Sul/Planalto Norte','Portal regional','portal',4,true,'Forte em São Bento do Sul e Planalto Norte'),
('SC Portais','scportais.com.br',null,'SC','Agregador/portal estadual','portal',4,true,'Portal catarinense com notícias regionais'),
('Tudo Aqui SC','tudoaquisc.com.br',null,'SC','Portal regional','portal',4,true,'Portal com cobertura regional de SC'),
('Blog do Prisco','blogdoprisco.com.br',null,'SC','Política/SC','portal',5,true,'Fonte relevante para política catarinense')
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
delete from rss_queries where label like 'V13.2 Portal%';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V13.2 Portal NSC Total','site:nsctotal.com.br Santa Catarina OR SC','Radar Estadual',null,'SC',5,true),
('V13.2 Portal G1 SC','site:g1.globo.com/sc/santa-catarina Santa Catarina OR SC','Radar Estadual',null,'SC',5,true),
('V13.2 Portal Diarinho','site:diarinho.net Itajaí OR Balneário Camboriú OR Santa Catarina OR SC','Radar Local','Itajaí','Litoral Norte',5,true),
('V13.2 Portal Imagem da Ilha','site:imagemdailha.com.br Florianópolis OR Floripa OR Santa Catarina','Radar Local','Florianópolis','Grande Florianópolis',4,true),
('V13.2 Portal CNN SC','site:cnnbrasil.com.br/tudo-sobre/santa-catarina Santa Catarina OR SC','Radar Nacional/SC',null,'SC',4,true),
('V13.2 Portal SCC10','site:scc10.com.br Santa Catarina OR SC','Radar Estadual',null,'SC',5,true),
('V13.2 Portal Santa Catarina em Pauta','site:santacatarinaempauta.com.br Santa Catarina OR governo OR Alesc OR Jorginho','Política',null,'SC',5,true),
('V13.2 Portal GZH SC','site:gauchazh.clicrbs.com.br/ultimas-noticias/tag/santa-catarina Santa Catarina OR SC','Radar Nacional/SC',null,'SC',3,true),
('V13.2 Portal Folha SC','site:folha.uol.com.br/folha-topicos/santa-catarina-estado Santa Catarina OR SC','Radar Nacional/SC',null,'SC',3,true),
('V13.2 Portal RCN Online','site:rcnonline.com.br Santa Catarina OR SC','Radar Local',null,'SC',4,true),
('V13.2 Portal UOL SC','site:noticias.uol.com.br/santa-catarina/noticias Santa Catarina OR SC','Radar Nacional/SC',null,'SC',3,true),
('V13.2 Portal Correio SC','site:correiosc.com.br Santa Catarina OR SC','Radar Local',null,'SC',4,true),
('V13.2 Portal Gazeta SBS','site:gazetasbs.com.br São Bento do Sul OR Sao Bento do Sul OR Santa Catarina','Radar Local','São Bento do Sul','Planalto Norte',4,true),
('V13.2 Portal SC Portais','site:scportais.com.br Santa Catarina OR SC','Radar Estadual',null,'SC',4,true),
('V13.2 Portal Tudo Aqui SC','site:tudoaquisc.com.br Santa Catarina OR SC','Radar Local',null,'SC',4,true),
('V13.2 Portal Blog do Prisco','site:blogdoprisco.com.br Santa Catarina OR política OR governo OR Alesc OR Jorginho','Política',null,'SC',5,true),
('V13.2 Portal Rodovias SC','(site:nsctotal.com.br OR site:g1.globo.com/sc/santa-catarina OR site:scc10.com.br OR site:diarinho.net) acidente OR rodovia OR BR-101 OR BR-282 OR BR-470 OR SC-155 Santa Catarina','Trânsito/Rodovias',null,'SC',5,true),
('V13.2 Portal Política SC','(site:blogdoprisco.com.br OR site:santacatarinaempauta.com.br OR site:nsctotal.com.br OR site:g1.globo.com/sc/santa-catarina) governo OR Alesc OR deputado OR prefeito OR vereador Santa Catarina','Política',null,'SC',5,true);
