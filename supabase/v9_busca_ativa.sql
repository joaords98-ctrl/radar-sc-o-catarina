-- Radar SC v9 — busca ativa + reforço de consultas por cidade/rodovia
-- Rode depois da v8. Pode rodar mais de uma vez.

delete from rss_queries where label like 'V9 %';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V9 Vídeos rodovias SC','"Santa Catarina" vídeo acidente caminhão carro tombou rodovia BR-101 BR-282 BR-470 SC-155 SC-283', 'Trânsito/Rodovias', null, 'SC', 6, true),
('V9 SC-155 Oeste','"SC-155" OR "SC 155" caminhão tombou acidente vídeo "Oeste" "Santa Catarina"', 'Trânsito/Rodovias', null, 'Oeste', 6, true),
('V9 BR-101 Litoral','"BR-101" Santa Catarina acidente vídeo trânsito caminhão carro Itajaí Balneário Camboriú Joinville Palhoça', 'Trânsito/Rodovias', null, 'Litoral/Norte', 6, true),
('V9 BR-470 Vale','"BR-470" Santa Catarina acidente trânsito caminhão carro Blumenau Gaspar Indaial Rio do Sul', 'Trânsito/Rodovias', null, 'Vale do Itajaí', 5, true),
('V9 BR-282 Oeste Serra','"BR-282" Santa Catarina acidente trânsito caminhão carro Chapecó Lages Joaçaba', 'Trânsito/Rodovias', null, 'Oeste/Serra', 5, true),
('V9 Política local forte','Santa Catarina prefeitura câmara vereadores prefeito contrato licitação denúncia investigação município', 'Política', null, 'SC', 5, true),
('V9 Saúde local','Santa Catarina hospital atendimento fila emergência saúde prefeitura município', 'Serviços Públicos', null, 'SC', 4, true),
('V9 Educação local','Santa Catarina escola creche educação prefeitura município alunos professores', 'Serviços Públicos', null, 'SC', 4, true),
('V9 Comunidade e cotidiano','Santa Catarina moradores bairro comunidade obra trânsito problema prefeitura', 'Comunidade', null, 'SC', 4, true),
('V9 Causa animal SC','Santa Catarina maus-tratos animal cachorro gato resgate abandono polícia ambiental protetores', 'Causa Animal', null, 'SC', 4, true);

-- Reclassifica vídeos/rodovias recentes que entraram como Geral/Segurança.
update news_items
set topic = 'Trânsito/Rodovias'
where published_at >= now() - interval '72 hours'
and lower(title || ' ' || coalesce(summary,'')) like any(array[
  '%vídeo%', '%video%', '%caminhão%', '%caminhao%', '%tombou%', '%rodovia%', '%br-101%', '%br 101%', '%br-282%', '%br 282%', '%br-470%', '%br 470%', '%sc-155%', '%sc 155%'
])
and lower(title || ' ' || coalesce(summary,'')) like any(array['%acidente%', '%trânsito%', '%transito%', '%rodovia%', '%tombou%']);
