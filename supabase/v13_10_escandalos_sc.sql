-- Radar SC v13.10 — Buscas de escândalos, denúncias e dinheiro público em Santa Catarina
-- Rode no Supabase após a v13.5+.

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('Escândalos SC — geral','Santa Catarina denúncia investigação corrupção fraude irregularidade contrato licitação prefeito vereador servidor','Escândalos/Denúncias',null,'SC',7,true),
('Escândalos SC — dinheiro público','Santa Catarina desvio dinheiro público superfaturamento sobrepreço obra contrato licitação prefeitura','Dinheiro Público',null,'SC',7,true),
('Escândalos SC — TCE','TCE SC Tribunal de Contas Santa Catarina irregularidade contrato licitação prefeitura obra suspende determina','Escândalos/Denúncias',null,'SC',7,true),
('Escândalos SC — MPSC','MPSC Ministério Público Santa Catarina investigação denúncia improbidade prefeito vereador servidor prefeitura','Escândalos/Denúncias',null,'SC',7,true),
('Escândalos SC — Gaeco','Gaeco Santa Catarina operação prefeitura câmara vereador servidor corrupção investigação mandado','Escândalos/Denúncias',null,'SC',7,true),
('Escândalos SC — licitações','licitação suspeita irregularidade contrato prefeitura Santa Catarina TCE MPSC superfaturamento','Dinheiro Público',null,'SC',6,true),
('Escândalos SC — câmaras','câmara vereadores Santa Catarina denúncia investigação gasto verba gabinete cassação CPI rachadinha','Política',null,'SC',6,true),
('Escândalos SC — prefeituras','prefeitura Santa Catarina denúncia investigação irregularidade contrato obra licitação nepotismo prefeito','Política',null,'SC',6,true),
('Escândalos SC — saúde pública','Santa Catarina hospital saúde denúncia fila contrato irregularidade OS prefeitura secretário saúde','Serviços Públicos',null,'SC',5,true),
('Escândalos SC — educação','Santa Catarina educação escola creche merenda transporte escolar contrato denúncia prefeitura irregularidade','Serviços Públicos',null,'SC',5,true),
('Escândalos Joinville','Joinville denúncia investigação contrato licitação prefeitura câmara TCE MPSC corrupção','Escândalos/Denúncias','Joinville','Norte',6,true),
('Escândalos Florianópolis','Florianópolis denúncia investigação contrato licitação prefeitura câmara TCE MPSC corrupção','Escândalos/Denúncias','Florianópolis','Grande Florianópolis',6,true),
('Escândalos Blumenau','Blumenau denúncia investigação contrato licitação prefeitura câmara TCE MPSC corrupção','Escândalos/Denúncias','Blumenau','Vale do Itajaí',6,true),
('Escândalos Itajaí','Itajaí denúncia investigação contrato licitação prefeitura porto câmara TCE MPSC corrupção','Escândalos/Denúncias','Itajaí','Litoral Norte',6,true),
('Escândalos Chapecó','Chapecó denúncia investigação contrato licitação prefeitura câmara TCE MPSC corrupção','Escândalos/Denúncias','Chapecó','Oeste',6,true),
('Escândalos Criciúma','Criciúma denúncia investigação contrato licitação prefeitura câmara TCE MPSC corrupção','Escândalos/Denúncias','Criciúma','Sul',6,true),
('Escândalos Lages','Lages denúncia investigação contrato licitação prefeitura câmara TCE MPSC corrupção','Escândalos/Denúncias','Lages','Serra',6,true),
('Escândalos Brusque','Brusque denúncia investigação contrato licitação prefeitura câmara TCE MPSC corrupção','Escândalos/Denúncias','Brusque','Vale do Itajaí',5,true),
('Escândalos Concórdia','Concórdia denúncia investigação contrato licitação prefeitura câmara TCE MPSC corrupção','Escândalos/Denúncias','Concórdia','Oeste',5,true),
('Escândalos Caçador','Caçador denúncia investigação contrato licitação prefeitura câmara TCE MPSC corrupção','Escândalos/Denúncias','Caçador','Meio-Oeste',5,true)
on conflict do nothing;
