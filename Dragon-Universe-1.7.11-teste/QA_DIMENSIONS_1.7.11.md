# QA Dimensions 1.7.11 — Crivo

27/10/2026. Continuação da mesma auditoria, após integração da correção de leitura de origem por Forja. **ACEITO CONDICIONALMENTE A FONTE ATUAL PARA BUILD DE CANDIDATO CONTROLADO 1.7.11.** O único achado causal desta revisão, P2 de classificação anterior ao lookup, está corrigido e revalidado. Não há outro bloqueador causal demonstrado nos checks executados.

Esta decisão não aprova o gate global, o validador geral ou o funcionamento no Minecraft. Não autoriza anúncio de prontidão: os três artefatos reais ainda precisam de build e nova auditoria nominal; depois, aceite nativo pelo roteiro em mundo novo/cópia.

Checkout somente leitura: C:/Users/rvmm2/Downloads/DragonUniverse1.7.1E/.maestri/roles/cac3a97f-f5cb-4647-a9f9-83558bb28155/.work/integration.
Entrega local: C:/Users/rvmm2/Downloads/DragonUniverse1.7.1E/.maestri/roles/a31c9b0f-3b1d-480e-8f08-a8f223b76841.

## Escopo e congelamento

Li o prefixo atual do Dragon Universe Contract, RESUME final, README e os quatro handoffs Dimensions. A retomada não reiniciou essa pesquisa: somente o handoff ORIGIN_READ e a alteração integrada foram conferidos após a pausa nominal.

O snapshot SOURCE_QA_1711_POST_ORIGIN_BASELINE.json tem SHA-256 e66873f1c682ba1ae689bc30758fee869559050c2999aabf3bb5d5bc5ba639e3. Seus2773 arquivos (2712pack+61tools) coincidiram antes/depois. Comparado ao congelamento original, só os seis scripts autorizados diferem; nenhuma ferramenta/assert/fixture anterior mudou. Index/NPC e Other World coincidem byte a byte com1710.

Checkpoints: travel_safety.js d4de7912dc8290e0ca6dc252cc40bee7b482d25f418a091862371467a19e5094; space_planets.js b85889951ea2e331b1217dae10a1675e899b9b7ec0724b8822747f81463c0488. Arquivos179 e1710 preservados com hashes443bec7d89726629b895741d1e389615a2eccfa74c3f07871e678a94b3973edd e aa07e76d8b70a6cf845a81295138ab1aa1c7d1e95af71582c61d7c67e074aea5.

Não houve produção, save, mundo, commit, build, conta/modelo, rotina ou outro especialista alterado/acionado por Crivo. O Coordinator reabriu Forja e integrou sua correção; QA não escreveu runtime.

## Achado causal e fechamento

**P2 — classificação de falha antes de qualquer lookup. Resolvido por Forja.**

Locais: travel_safety.js, safeReturnToEarth; hell_dimension.js, guarda de sendToHell; sendHome em Space/Kaioshin/Arena/Hell/Namek. Gatilhos reproduzidos: getter location/dimension da origem ou getDynamicProperty da origem salva lança. Esperado: preparação, nenhuma alegação de destino indisponível ou teleporte quando nem consulta nem movimento foram tentados; causa preservada, reservas liberadas e retry viável.

Antes: as sete variantes tinham zero getDimension, zero movimentos e limpeza de pending/travelling, mas seis eram reportadas como lookup e Space return caía no fallback teleport. A primeira prova0/3 foi desdobrada em0/7, sem contabilizar reruns como novos defeitos. Logs qa-origin-classification.tap e qa-origin-classification-all.tap preservam os negativos; a tentativa preliminar com binding assert ausente é instrumentação, não evidência de runtime.

Correção incremental do owner: patch88b33d325d598405fa1cc8f19b1404c177568868618805f6a48fd849c6fa65e6. Fase origin passa a preparation; lookup só começa ao consultar destino. Space return passa contexto Terra/fase; depois de retorno concluído, falhas subsequentes continuam como teleport. Leases, destinos, parsing, fallbacks, readiness, terreno e3chaves não foram alterados.

Eu reexecutei o teste original: **7/7**, SHA9180146a61f4e7504dd40bcaf10037ac86eb31ff7d0d6ad4bafdf2c8ad5da232. Seus bytes completos foram preservados como prefixo do teste final e em evidence-dimensions-1711/qa-seven-original.mjs. Acrescentei somente quatro casos para lacunas de repetição/controles e causas cíclicas: teste final **11/11**, SHAa99f4d989548d64d2cbda76b3adef1e8b6c7c7b836e366eaa1860903d23ef62e.

## Causa de loading e autoridade

A comparação direta com o ZIP1710 confirmou que cada um dos oito JSONs atuais é o mesmo arquivo, com apenas a string raiz format_version1.26.50 recolocada. IDs físicos, objetos minecraft:dimension, biomas, gerador void, altura-64/384 e catálogos permanecem preservados. Os11 checks metadata e2 do validador passaram.

A retirada desse metadado na1710 é uma regressão de artefato, coerente com o relato de falta de versão válida/malformed. O warning antigo de campo não demonstrava que o loader dispensava a versão: o mesmo log179 registrava substituição das definições script pelas BP. Isso sustenta restaurar o pin anterior, sem provar que toda falha de viagem tinha a mesma causa.

A referência primária e o snapshot Mojang citados por World são da família minecraft:dimension; o formulário retail tem dataVersion1.26.50. O URL do schema integral retornou404. O schema local é só contrato de envelope/pin: **não é schema integral nem simulação do loader**. Rejeitar1.26.52 no teste significa divergência desse pin, não prova de que o engine rejeita tal formato.

BP continua autoridade dos oito documentos. Não há novo registerCustomDimension nesses módulos, fake dimension, ID alternativo ou fallback que transforme lookup falho em sucesso. Core/index permanece igual ao1710: quatro registros runtime-only e cinquenta espaços de cajado preservados. A ausência de registro duplicado é prova estática, não prova de ordem privada do loader.

Manifests/crossdeps/módulos estão1.7.11 e mínimo[1,26,50]; UUIDs, APIs beta e demais metadados permanecem iguais à1710. Alvo informado: Minecraft26.52/Appx1.26.5203.0, APIs Beta e Próximo Recurso de Criador. Esses números não são comparados por igualdade à versão do addon.

## Rotas, origens e compatibilidade

| Destino | ID físico | Caminho exercitado / controle |
|---|---|---|
| Vegeta | dbe:vegeta | Space travelTo, primeira/repetida ida e retorno Terra |
| Freeza | dbe:frieza_planet | Mesma rota, mantendo distinção do bioma dbe:frieza |
| Yardrat | dbe:yardrat | Mesma rota e origem |
| Kaioshin | dbe:kai | Bridge dbe:kaioshin e sendToKaioshin; aliases e origem legada mantidos |
| Arena | dbe:universe_6_arena | Bridge dbe:tournament e sendToArena; origem u6 preservada |
| Hell | dbe:hell | sendToHell; não inventado item Navigator |
| Space | dbe:space | Dois ciclos Space→Namek→Terra com origem original mantida |
| Namek | dbe:namek | Delegação real do corpo Space, caller próprio e retorno |

Systems49 executa os corpos reais das rotas/helper, com quatro classes de falha por destino, retry, reservas/leases e confirmação de chegada. Foram conferidos origem, lookup, comando/dispatch rejeitado com zero lookup, preparação/geração, loading/timeout/criação tardia, prova de apoio, interrupção/teleporte, falha após movimento e término do fallback após chegada não confirmada. O menu observa preparo pendente das rotas testadas; a Promise de preparo Arena rejeitada pode ser refeita.

QA acrescentou duas idas/voltas completas para cada uma das seis rotas, dois ciclos Space→Namek→Terra sem sobrescrever a casa original e o corpo de queda Other World→Hell→Other World. O retorno usa o ponto previsto de Other World, sem migrar seus IDs ou progresso. Esses são casos Node com fronteiras nativas simuladas; especialmente o dispatch scriptevent do fixture é delegação controlada, não confirmação da ordem do evento no jogo.

Content16/16 permanece demonstrado como2casos novos+14existentes (Core8, nomesKai5,refs1). Os métodos reais de story/gates/serialização são exercitados por esse conjunto; os envelopes de quest não executam combate inteiro. O delta direto prova que dados, player definitions, index/NPC e Other World não mudaram. Não houve migração de dbe:kai para dimensão nova ou mudança de Other World/King Kai/Kaioken.

Diagnósticos: fases precisas/cadeia causal ficam no log; chat recebe chave localizada e um ID físico. Visual4 valida os três idiomas, cada entrada antiga byte a byte e as três novas chaves com um%s. QA11 testa alias físico, privacidade, ciclo limitado a8quadros e dedup antes/depois de100ticks. Nenhuma promessa de rollback seguro ou de ausência de movimento é feita após falha de confirmação.

## Gates executados e contagem distinta

Comando uniforme: node --test --test-isolation=none --test-reporter=tap. Todas as suítes foram executadas em série, na fonte integrada; sem overlay ou alteração dos arquivos anteriores. Comandos/paths/status estão em evidence-dimensions-1711/gates.json e gate-command.ps1.txt; logs por arquivo .tap.

| Grupo disjunto desta execução | Casos | Pass / fail |
|---|---:|---:|
| Metadata + regra validator | 13 |13/0|
| Systems Dimensions |49|49/0|
| Novo QA final |11|11/0|
| Content novo |2|2/0|
| Visual novo |4|4/0|
| Core/Earth/recovery returns |37|37/0|
| NomesKai + destination refs |6|6/0|
| Runtime lifecycle179 |14|14/0|
| Systems native1710, inclui custo NPC |27|26/1|
| Space native1710 |24|24/0|
| World repair + lifecycle |32|32/0|
| Future preservation/progress/native-failure/wait + SystemsFuture |43|43/0|
| Future travel179 |3|2/1|
| Future lifecycle QA179 |15|10/5|
| Future feedback179 |4|3/1|
| **Total distinto** |**284**|**276/8**|

Zero skips, cancelamentos ou TODO. distinct-cases.json deduplica os nomes e registra cada contexto; não houve duplicata entre os grupos finais. Os snapshots7/7,95doCoordinator,117pre-locales e reruns não são somados. Visual8inclui quatro novos e quatro casos já contados (três Future e um Systems); Content16 inclui Core/nomes/refs acima.

O subconjunto correspondente ao antigo117/117 foi executado na fonte final e agora é **116/117**, pela allowlist histórica de idiomas. Não reutilizo o snapshot pré-locales como aprovação atual. O gate global421 não foi repetido nem certificado.

## Três contratos históricos, intactos e não verdes

1. **test-systems-native-1710.mjs:50** exige helper inteiro igual à179. A mudança compartilhada foi autorizada na1711, portanto a igualdade é incompatível com o escopo atual; a asserção original continua falhando. Em vez de fingir aprovação, as semânticas atuais são cobertas por Systems49/QA11/retornos/timeout. A parte runTerrainJob que ficava após essa primeira asserção foi comparada separadamente: corpo normalizado exatamente igual à179, SHA fafa9649ab57e6c30bfa977752e7dde80e0501ab20a9a273a8a174ad701547ab.
2. **test-future-travel-179.mjs:56** exige string com erro cru no chat de outros destinos. Isso agora é proibido; o caso continua falhando. Rotas e idiomas atuais comprovam chaves, ID, causa só no log; QA comprova também ciclo/limite/dedup que poderiam ficar sem execução depois da primeira asserção antiga.
3. **test-future-feedback-179.mjs:81** permite apenas adições Future/staff antes de comparar com178. Ele rejeita as três travel keys autorizadas e continua falhando. Visual e a comparação binária independente retiram somente essas três linhas e obtêm todos os bytes anteriores iguais ao ZIP1710; nenhum idioma antigo foi reescrito.

Não alterei assertions ou fixtures congelados para produzir verde. A reconciliação é aceitar explicitamente o novo contrato para esta candidata e conservar as três falhas originais no registro, sem estender essa exceção a futuros deltas.

## Cinco wrappers Future e execução direta

O wrapper original permaneceu **10/15**. Um probe diagnóstico com os mesmos args comprovou nos cinco casos statusnull/error.code EPERM; não interceptou spawn e não elevou permissões. Ele não é contado como teste adicional.

Os cinco payloads originais --qa-rejection-child foram executados separadamente por Node e terminaram exit0. Seus reports passaram nas mesmas asserções de unhandled/originalError/sharedIdentity/timeout2400/wrong-dimension. --frozen continua usando a referência178 do teste original. JSON/stdout/stderr, comandos e assertions estão em future-*.json/.stderr, future-direct-executions.json e future-direct-assertions.json.

São **5/5 semânticas dos mesmos cinco casos**, não cinco casos novos nem conversão do wrapper bloqueado em15/15. Não há alegação de ausência de EPERM no gate.

## Checks estáticos, validador e preservação

- Grafo pelo checker original executado diretamente no BP fonte: entry scripts/index.js,33módulos,0erros, exit0. É parse/resolução estáticos, não startup no Minecraft. node --check do QA e git diff --check da fonte passaram.
- Validador geral original executado: **exit1,41erros/42avisos**. validate-json1EPERM, refs6erros/8avisos, data1erro/31avisos, syntax33EPERM; mais3avisos em validate-json. Diretamente, o checker de grafo passa; o comando original continua não aprovado.
- Dos41erros,34são impedimentos de subprocesso e7diagnósticos históricos: quatro texturas UI, dois caminhos vanilla loot/trading e healing_power sem trainer/reward no grafo. Não infiro defeito nativo de recurso vanilla pela ausência no addon; resolução no jogo continua pendente.
- Delta fonte1711 vs ZIP1710 recalculado: **19changed,0add,0remove,2693same**, com todos os hashes/tamanhos iguais ao DELTA publicado. Somente8JSONdimensionais,6scripts,2manifests e3locales. Comparação raw dos idiomas preserva comentários, ordem, CRLF e todas as linhas antigas.
- source-before/post-origin-source-before/source-after registram congelamentos e correção autorizada. SOURCE_QA original e pós-P2 têm o mesmo conjunto de2773paths; só os6scripts diferem entre eles. Durante esta retomada, nenhum dos2773bytes-hash mudou.

As evidências são estáticas/Node. A primeira versão do novo controle cíclico exigiu quadros únicos, embora o contrato existente limite profundidade em8e possa repetir a causa do ciclo; a asserção local foi corrigida para exigir exatamente o limite8. Tentativa guardada em qa-cyclic-first-attempt.tap; nenhum teste anterior ou produção mudou.

## Limites e próximo passo

**Minecraft: não executado.** O alvo instalado/experimentos são os informados; o último sky.list_apps falhou com native pipe os error2 em validation-1711-native-availability.json. Não houve nova tentativa CUA, UI input, instalação ou save nesta revisão. Parse, mock disponível e metadados não demonstram que o loader aceitou os oito documentos.

Aceite nativo ainda exige: mundo novo e cópia com backup; BP/RP1.7.11 realmente ativos; oito definições/biomas carregados; seis rotas+Space/Namek; primeira/repetida ida e retorno/origins; Kaioshin legado; Other World→Hell; eventos de comando e reservas em multiplayer; preparo/teleporte interrompido; prova depois de movimento; mensagens nos três idiomas; terreno/reload, NPC/custo/recibo e persistência em disco. Sem benchmark/watchdog sob carga ou garantia de atomicidade/rollback após crash.

Coordinator deve integrar somente o teste QA e estes dois documentos, fechar README/RELEASE/roteiro públicos com os números atuais e as três exceções explícitas, construir candidata distinta1711 e pedir nova auditoria independente dos três arquivos reais. Esta entrega não empacota nem aprova instaláveis futuros. Rotina bd2939 permanece desativada; nenhum outro especialista foi acionado por QA.

Entrega local: `QA_DIMENSIONS_1.7.11.patch` cont?m apenas o teste QA e estes dois documentos. `QA_DIMENSIONS_1.7.11.sha256` identifica arquivos, patch e evid?ncias de `evidence-dimensions-1711/`; os logs permanecem fora da produ??o. Aplica??o do patch cabe ao Coordinator. Nenhum instal?vel foi produzido nesta etapa.
