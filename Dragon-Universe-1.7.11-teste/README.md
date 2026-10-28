# Dragon Universe 1.7.11 — dimensões e viagens

**Candidata 1.7.11 para teste controlado; teste nativo pendente.** A fonte recebeu aceite condicional de QA para build. A entrega deve ser acompanhada de QA_ARTEFATOS_1.7.11.md e ENTREGA_1.7.11.json, emitidos depois do congelamento dos três instaláveis e confirmando seus hashes. Este README é congelado no build; a decisão externa completa o registro sem reescrever os ZIPs. A correção continua o projeto existente após a falha da candidata 1.7.10. Os instaláveis 1.7.9/1.7.10, mundos, inventários e construções foram preservados. Não houve teste no Minecraft nesta investigação.

## Causa e relação com o teleporte

A candidata 1.7.10 removeu `format_version` da raiz dos oito documentos de dimensão. A comparação dos membros dos ZIPs, das cópias extraídas e das fontes confirmou que a versão `1.26.50` existia na 1.7.9 e era a única diferença semântica nesses documentos. Os objetos de dimensão continuavam iguais.

O aviso antigo de campo ausente do schema não autorizava remover o metadado do documento: no mesmo log 1.7.9, as oito definições do BP substituíam os registros duplicados por script. O novo relato de falta de versão válida e falha ao carregar a dimensão corresponde à informação removida na 1.7.10. Sem uma dimensão carregada para o ID solicitado, `getDimension` não consegue fornecer o destino para preparar terreno e teleportar.

A correção World restaura apenas `"format_version":"1.26.50"` na raiz de cada um dos oito JSONs. O restante dos bytes 1.7.10 é preservado: IDs, biomas, geração void, altura mínima -64 e faixa 384. Não foi criado registro script-only para mascarar a falha do BP, nem outro destino como substituto.

Havia um segundo problema de diagnóstico: Hell, arena e Namek sugeriam incompatibilidade de versão para qualquer exceção, e o feedback compartilhado expunha detalhes nativos no chat. Systems agora registra ID, etapa e causa original no Content Log, com três categorias localizadas para o jogador. Falha de comando antes de getDimension é dispatch/preparação, sem afirmar ausência de dimensão. As três categorias já estão integradas em pt_BR, en_US e es_ES, com um parâmetro de ID físico e preservação de todas as linhas anteriores.

Também foram reproduzidas reservas presas quando a leitura da origem lançava antes do try/finally, cache de preparação da arena retendo uma Promise rejeitada e menu liberando a reserva antes de observar a viagem. Essas correções foram integradas. A QA independente encontrou ainda leituras da origem reportadas como lookup (ou teleporte no retorno Space) antes de qualquer consulta/movimento. A fase origin agora usa preparação; lookup só começa na consulta real. Os mesmos sete casos negativos passaram de 0/7 para 7/7 após o patch incremental, mantendo causa original, liberação de reservas e nova tentativa. Detalhes em SYSTEMS_DIMENSIONS_1.7.11_ORIGIN_READ.md. O retorno preserva a causa do último candidato e encerra tentativas após movimento cuja confirmação falhou; não inventa chegada nem força rollback para uma origem possivelmente insegura.

## Versões e ambiente efetivamente identificados

| Item | Valor e origem |
|---|---|
| Minecraft usado pelo usuário | 26.52, confirmado na tela inicial pelo usuário |
| Aplicativo Windows | Microsoft.MinecraftUWP 1.26.5203.0, confirmado por Get-AppxPackage e pelo usuário |
| Packs ativos no mundo | Relato do usuário: 1.7.10. Não houve observação da lista ativa no jogo; confirmar BP/RP 1.7.11 durante o teste |
| Experimentos no mundo relatado | APIs Beta e Próximo Recurso de Criador, confirmados pelo usuário |
| Versão desta entrega de addon | 1.7.11; a 1.7.10 preservada é o controle da regressão |
| Formato dos manifests | 2; UUIDs dos packs e módulos preservados |
| Mínimo declarado da candidata | [1,26,50], alinhado ao recurso de definição BP anunciado no changelog 26.50 |
| Dependências de Script API | @minecraft/server beta e @minecraft/server-ui beta, sem troca de versão declarada |
| Metadado das definições BP | format_version string 1.26.50; distinto da versão do addon e do número exibido do jogo |
| Fonte | HEAD 0b5740e582cc1af574d04b14611156953d182490, com alterações acumuladas preservadas na branch fix/du-combat-progression |

O mínimo declarado não é diagnóstico de que o jogo 26.52 seja incompatível. O valor de formato selecionado é o pin restaurado com evidência; não se afirma que seja o único valor reconhecido por todas as versões do engine. A versão de um exemplo de API de registro por script não foi reutilizada como formato de documento BP.

## Destinos e compatibilidade de mundos

| Destino | ID físico preservado | Observação |
|---|---|---|
| Vegeta | dbe:vegeta | Definição BP própria |
| Freeza/Frieza | dbe:frieza_planet | Bioma dbe:frieza preservado |
| Yardrat | dbe:yardrat | Definição BP própria |
| Kaioshin | dbe:kai | ID de armazenamento legado intencional; nome lógico kaioshin/dbe:kaioshin usa compatibilidade explícita |
| Arena do Universo 6 | dbe:universe_6_arena | ID confirmado no módulo de viagem e na definição BP |
| Hell | dbe:hell | ID confirmado no módulo de viagem e na definição BP |
| Space e Namek | dbe:space e dbe:namek | Metadados também restaurados; são controles adicionais de viagem |

Não há migração física de `dbe:kai` para uma dimensão nova. Isso preserva terreno e propriedades existentes. A auditoria Content confirmou menus, história, tarefas salvas, comandos, aliases e retornos sem novo defeito causal nem necessidade de alterar dados. Hell não está no Navigator: suas entradas existentes são o comando dbe:hell e a queda de Other World. A saga Frieza usa Namek, não o planeta Frieza. `other_world`, Kaioken e personagens não relacionados permanecem reservados sem alteração. Não se apagam checkpoints nem se força regeneração para testar a correção.

## Alterações e responsáveis

| Área | Resultado atual |
|---|---|
| World / Atlas | Oito arquivos BP dimensions/*.json; novo teste de metadados, contrato local e relatório WORLD_DIMENSIONS_1.7.11.md |
| Coordinator | Manifests 1.7.11 e mínimo declarado; regra do validador que antes ignorava a ausência de versão; teste dessa regressão; expectativa de versão/minimum nas regressões; integração e documentação |
| Systems / Forja | Seis scripts corrigidos: travel_safety, space_planets, kaioshin_dimension, hell_dimension, universe_6_dimension e namek_dimension; teste de 49 casos e relatório integrados. Registros/IDs/geradores e index/NPC preservados |
| Content / Runa | Mapeamento dos oito destinos e compatibilidade confirmados, sem alteração de produção. Novo teste de story/gates reais e serialização de quests, mais relatório integrados; 16/16 no conjunto focado |
| Visual / Prisma | Três chaves acrescentadas em cada idioma; quatro testes novos e quatro existentes selecionados aprovados, integração byte a byte conferida. Nenhuma linha anterior alterada |
| QA / Crivo | Fonte aceita condicionalmente para build controlado: QA novo 11/11; conjunto distinto 276/284 com oito falhas classificadas abaixo. Auditoria dos instaláveis reais registrada em anexo externo posterior |

O inventário DELTA_1.7.11.json foi calculado contra o mcaddon 1.7.10 real preservado: 19 arquivos de produção alterados, zero adicionados/removidos e 2693 idênticos, com tamanho e SHA-256 antes/depois por caminho. Relatórios por especialidade são evidências da etapa correspondente e não substituem este fechamento integrado.

Fora dos packs, foram acrescentados tools/test-dimension-metadata-1711.mjs, tools/schemas/dimension-metadata-1711.schema.json, tools/test-dimension-validator-1711.mjs, tools/test-systems-dimensions-1711.mjs, tools/test-content-destinations-1711.mjs, tools/test-visual-dimensions-1711.mjs e tools/test-qa-dimensions-1711.mjs. Foram alterados tools/validate-json.mjs e a expectativa de versão/mínimo em tools/test-regressions.mjs; documentos/checkpoints/changelog registram integração e retomada. Nenhum helper local de especialista entra no pack. O empacotador original tools/package-addon.mjs é reutilizado; a criação dos ZIPs separados usa Python padrão porque os subprocessos do wrapper Node estão bloqueados neste ambiente, sem interceptar ou simular spawn.


## Validação disponível

- World: negativo na 1.7.10 arquivada com 3 passes e oito falhas esperadas pela ausência do campo; proposta e integração com 11/11.
- Validador: o teste executa a função real, que antes retornava zero erros para oito definições sem versão. Após a regra, 2/2 passaram. É um check do contrato do projeto, não uma simulação do loader.
- World e validador no checkout integrado: 13/13, sem skips ou cancelamentos.
- Regressões após atualizar manifests/expectativas: 41/41.
- Systems local: 49/49; regressões de retorno/recuperação/feedback/lifecycle 55/55. Antes da integração dos novos textos, o Coordinator repetiu esses conjuntos e os metadados no checkout integrado, sem overlay: 117/117, sem skips/cancelamentos. Esse resultado é um snapshot anterior às traduções; o comparador histórico de idiomas passa a exigir reconciliação abaixo.
- Após a correção incremental de diagnóstico de origem: sete provas QA independentes 7/7, Systems 49/49, retornos/recuperação 37/37 e dois casos Future selecionados 2/2, todos diretos no checkout (95 distintos; não somar reruns aos gates anteriores). Sintaxe dos seis scripts alterados passou.
- Sintaxe direta anterior: 33/33; grafo original de startup: 33 módulos, zero erros. Whitespace passou; a verificação do BP extraído real ocorrerá no build.
- O conjunto local Space/World/Future de Systems teve 68/74: cinco subprocessos EPERM e uma expectativa histórica de exceção crua no chat. Outro teste histórico exige helper byte a byte igual à 1.7.9, apesar da mudança compartilhada autorizada nesta tarefa. Os dois conflitos foram preservados para reconciliação explícita de QA; não são marcados como passes nem somados em duplicidade.
- Content: 16/16 no checkout integrado (dois novos e 14 existentes); 13 arquivos de dados/player/Other World/idiomas comparados ao ZIP 1.7.10 na etapa Runa, sem divergência. Oito testes core desse conjunto também estão no gate 117; não somar reruns ou sobreposições.
- Mensagens: quatro novos testes integrados, três regressores Future semânticos e uma prova existente de deduplicação, todos aprovados (8 distintos; um também está em Systems). O comparador histórico de idiomas 1.7.8 permite somente adções Future/staff e rejeita as novas três chaves autorizadas; permanece intacto para reconciliação explícita de QA. O novo teste prova preservação de todos os bytes anteriores e apenas as três adições exatas.
- QA independente: **276 passes / 284 casos distintos**, zero skips/cancelamentos/TODO. Oito falhas mantidas: cinco wrappers Future impedidos por EPERM/status nulo e três contratos históricos incompatíveis com os requisitos atuais. Os originais não foram alterados para produzir verde. Ver QA_DIMENSIONS_1.7.11.md para grupos, comandos e reconciliação completa.
- Novo QA 11/11, incluindo os sete negativos corrigidos, duas idas/voltas por destino, dois ciclos Space→Namek→Terra, Other World→Hell→Other World e causas cíclicas/deduplicação. São corpos de produção em Node com fronteiras nativas simuladas; não execução no Minecraft.
- O subconjunto do snapshot antigo 117/117 corresponde agora a **116/117** na fonte final, pela allowlist histórica de idiomas. A igualdade binária antiga do helper e a exigência de erro cru no chat são os outros dois conflitos. O novo contrato prova a preservação de entradas antigas, privacidade/cadeia causal e semânticas atuais sem ocultar as falhas originais.
- Os mesmos cinco payloads Future bloqueados no wrapper foram executados diretamente por Node: 5/5 nas mesmas asserções. Isso não acrescenta cinco casos, não converte o wrapper 10/15 em 15/15 e não resolve EPERM.
- Validador geral original: **41 erros / 42 avisos, exit 1**; 34 impedimentos ambientais e sete diagnósticos herdados (quatro texturas UI, dois caminhos vanilla e healing_power sem trainer/reward no grafo). Não está verde. O gate global 421 não foi repetido nem certificado.
- Integridade dos instaláveis: o certificado VERIFICACAO.json registra CRC, comparação de todos os bytes com a fonte, manifests e grafo original do BP extraído real. A auditoria independente externa deve conferir os mesmos hashes antes da autorização de entrega.

Não somar reruns ou controles negativos aos testes aprovados. Falhas ambientais conhecidas de subprocessos devem continuar explícitas; não serão interceptadas ou convertidas em passes. A revisão anterior 1.7.10 de CRC/bytes provava integridade, não carregamento de dimensões pelo engine.

## Evidência primária e limites

A referência Microsoft Learn `dimensiondocument` lista `format_version` string sem default na família `minecraft:dimension`. O snapshot Mojang bedrock-schemas retail v1.26.50.26 identifica a mesma família e dataVersion 1.26.50; seus formulários documentam os componentes preservados. Formulário de editor e schema integral do loader não foram tratados como equivalentes. A família `minecraft:dimension_type` não foi aplicada a esses documentos.

O URL fornecido para um suposto schema completo em bedrock-samples retornou 404. Não se inventou esse conteúdo. O schema local entregue é apenas contrato de regressão de envelope e pin. Referências e limites completos estão em WORLD_DIMENSIONS_1.7.11.md e na entrega World identificada ali.

O pacote do Minecraft foi identificado, mas a automação nativa falhou em sky.list_apps por native pipe indisponível, os error 2. Não houve janela controlada, instalação, criação de mundo, alteração de save ou execução de teleporte no Minecraft. Carregamento real, física, geração sob carga, persistência/reload, multiplayer e retorno continuam pendentes de teste no jogo.

Falhas pré-movimento mantêm a origem nos cenários automatizados cobertos e liberam reservas/leases para retry. Se o engine já movimentou e a confirmação falha, o diagnóstico distingue esse estado, encerra candidatos adicionais e conserva evidência; não existe garantia de rollback nativo seguro. Os textos ao jogador não devem prometer ausência de movimento nessa situação.

## Teste do usuário e entrega

Após a auditoria dos arquivos reais, importar somente a candidata 1.7.11 correspondente, confirmar BP/RP ativos nessa versão e manter as experiências exigidas. Usar mundo novo e uma cópia com backup. Seguir o roteiro TESTES.md para os seis destinos, primeira/repetida visita, ida/volta, compatibilidade Kaioshin, falha segura e retomada.

Guardar Content Log completo, versão ativa dos dois packs, dimensão/coordenadas e o primeiro erro completo. Se uma definição não carregar, não apagar dados, checkpoints ou construções para tentar destravar. Não há evidência suficiente para atribuir os erros atuais a packs duplicados; isso não foi assumido como causa.

## Arquivos e instalação

Importação recomendada: Dragon-Universe-1.7.11.mcaddon, que contém os dois packs. Os arquivos Dragon-Universe-1.7.11-behavior_packs.zip e Dragon-Universe-1.7.11-resource_packs.zip são alternativas para instalação manual e contêm as categorias correspondentes e os documentos de apoio. Confirmar BP/RP 1.7.11 ativos na cópia de teste; não há migração ou remoção de mundo a executar.

Os SHA-256 dos três arquivos estão em Dragon-Universe-1.7.11.sha256, VERIFICACAO.json e no registro externo ENTREGA_1.7.11.json. O ledger completo PACK_SOURCE_LEDGER_1.7.11.json declara cada caminho/tamanho/SHA-256; seu hash é o SHA-256 dos bytes UTF-8 do próprio documento, sem agregado ambíguo. DELTA_1.7.11.json lista as 19 mudanças contra o arquivo real 1.7.10. A auditoria final QA_ARTEFATOS_1.7.11.md completa esta documentação após a geração e deve corresponder exatamente aos hashes recebidos.

O certificado de build pode registrar auditoria final pending por ser anterior à auditoria; o anexo e o registro externos são a decisão final, sem alterar os arquivos aprovados. Testes no Minecraft continuam pendentes. Rotina automática desativada; nenhum monitoramento será agendado.
