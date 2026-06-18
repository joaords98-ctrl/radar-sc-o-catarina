-- Radar SC v10 — Instagram Intelligence + reforço de buscas visuais
-- Opcional. Rode depois da v9 para melhorar pautas com vídeo, imagem, cidade e potencial de redes.

update rss_queries
set enabled = false
where label in ('SC Segurança pública');

delete from rss_queries where label like 'V10 %';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V10 Reels SC vídeo forte','"Santa Catarina" vídeo mostra momento flagrante imagens acidente caminhão carro rodovia', 'Trânsito/Rodovias', null, 'SC', 7, true),
('V10 Stories utilidade pública SC','"Santa Catarina" alerta trânsito bloqueio interdição chuva defesa civil serviço hoje', 'Serviços Públicos', null, 'SC', 6, true),
('V10 Carrossel política local SC','"Santa Catarina" prefeito vereadores câmara contrato licitação denúncia investigação município', 'Política', null, 'SC', 6, true),
('V10 Oeste visual','"Oeste de Santa Catarina" vídeo acidente caminhão carro tombou rodovia cidade hoje', 'Trânsito/Rodovias', null, 'Oeste', 6, true),
('V10 Vale visual','"Vale do Itajaí" vídeo acidente trânsito rodovia prefeitura problema moradores hoje', 'Radar Regional', null, 'Vale do Itajaí', 5, true),
('V10 Litoral Norte visual','"Litoral Norte" Itajaí Balneário Camboriú vídeo acidente trânsito turismo prefeitura hoje', 'Radar Regional', null, 'Litoral Norte', 5, true),
('V10 Sul visual','"Sul de Santa Catarina" vídeo acidente trânsito prefeitura moradores Criciúma Tubarão hoje', 'Radar Regional', null, 'Sul', 5, true),
('V10 Joinville Instagram','Joinville vídeo mostra acidente trânsito prefeitura moradores flagrante hoje', 'Radar Local', 'Joinville', 'Norte', 5, true),
('V10 Florianópolis Instagram','Florianópolis Floripa vídeo mostra acidente trânsito prefeitura moradores flagrante hoje', 'Radar Local', 'Florianópolis', 'Grande Florianópolis', 5, true),
('V10 Blumenau Instagram','Blumenau vídeo mostra acidente trânsito prefeitura moradores flagrante hoje', 'Radar Local', 'Blumenau', 'Vale do Itajaí', 5, true),
('V10 Itajaí Instagram','Itajaí vídeo mostra acidente trânsito BR-101 prefeitura moradores flagrante hoje', 'Radar Local', 'Itajaí', 'Litoral Norte', 5, true),
('V10 Chapecó Instagram','Chapecó vídeo mostra acidente trânsito prefeitura moradores flagrante hoje', 'Radar Local', 'Chapecó', 'Oeste', 5, true);

-- Ajuste de tema para pautas visuais que rendem Instagram.
update news_items
set topic = 'Trânsito/Rodovias'
where published_at >= now() - interval '72 hours'
and lower(title || ' ' || coalesce(summary,'')) like any(array[
  '%vídeo%', '%video%', '%flagra%', '%imagens%', '%mostra%', '%câmera%', '%camera%'
])
and lower(title || ' ' || coalesce(summary,'')) like any(array[
  '%acidente%', '%rodovia%', '%trânsito%', '%transito%', '%caminhão%', '%caminhao%', '%carro%', '%tombou%'
]);
