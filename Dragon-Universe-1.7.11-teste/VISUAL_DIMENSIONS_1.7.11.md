# Visual — mensagens de viagem 1.7.11

Prisma, 27/10/2026. Etapa nominal após World, Systems e Content integrados. **Proposta mínima: acrescentar três chaves em cada um dos três idiomas; nenhuma linha anterior alterada.** Ainda depende de integração e QA; não é aviso de instalável pronto.

## Fonte e entrega

Fonte somente leitura: `C:/Users/rvmm2/Downloads/DragonUniverse1.7.1E/.maestri/roles/cac3a97f-f5cb-4647-a9f9-83558bb28155/.work/integration`.

Raiz autorizada de Prisma: `C:/Users/rvmm2/Downloads/DragonUniverse1.7.1E/.maestri/roles/8890d005-b74c-4ea2-814b-58634972515b`.

Executei `maestri list`, li a nota `Dragon Universe Contract` e os documentos `SYSTEMS_DIMENSIONS_1.7.11.md`, `CONTENT_DIMENSIONS_1.7.11.md` e `README_1.7.11.md`. Mantive o modelo atual e o trabalho sequencial; nenhum agente adicional foi acionado. A única comunicação de entrega é para o Coordinator conectado `comedor de ram`.

Allowlist exata do patch:

- `Dragon Universe_rp/texts/pt_BR.lang`
- `Dragon Universe_rp/texts/en_US.lang`
- `Dragon Universe_rp/texts/es_ES.lang`
- `tools/test-visual-dimensions-1711.mjs` (novo)
- `docs/VISUAL_DIMENSIONS_1.7.11.md` (este relatório, novo)

Patch: `VISUAL_DIMENSIONS_1.7.11.patch`; checksums finais: `VISUAL_DIMENSIONS_1.7.11.sha256`, ambos na raiz autorizada. Logs locais em `docs/validation-visual-dimensions-1711.tap`, `docs/validation-visual-future-1711.tap`, `docs/validation-visual-dedup-1711.tap` e `docs/validation-visual-applied-1711.tap`; não são arquivos do pack nem fazem parte do patch.

## Contrato e semântica

Forja permanece o único editor de scripts/runtime. Conferi o consumidor real `Dragon Universe_bp/scripts/travel_safety.js:29`: cada mensagem usa `with: [destination]`, contendo o ID físico já resolvido pelo runtime. O ID técnico permanece no chat para suporte; não foi criado ID, mapa de nomes amigáveis ou substituição de Kaioshin público.

| Chave exata | Sentido comum a pt_BR, en_US e es_ES |
|---|---|
| `dbe.travel.failed.lookup` | Destino indisponível; pedir ao responsável pelo mundo que verifique o carregamento da dimensão no Content Log antes de usar o destino. Não atribui causa à versão nem recomenda repetir uma rota ausente. |
| `dbe.travel.failed.preparation` | Não foi possível iniciar a viagem ou preparar/validar a chegada. Abrange dispatch rejeitado antes de lookup, preparação, geração, prova de chegada e intenção de retorno, sem expor esses estágios internos no chat. Orienta consultar o Content Log com o responsável pelo mundo. |
| `dbe.travel.failed.teleport` | Não foi possível concluir ou confirmar a viagem. Inclui falha posterior ao movimento; orienta procurar local seguro e consultar o Content Log com o responsável pelo mundo. Não afirma ausência de movimento nem permanência na origem. |

Cada uma das nove entradas contém exatamente um `%s`, nenhum outro parâmetro ou exceção nativa. O ID recebido é exibido uma vez, sem tradução. Os textos não prometem segurança absoluta nem origem imutável. Exceção, cadeia causal e estágio preciso continuam apenas no log. A deduplicação de 100 ticks e a prioridade de `dbe.future.*` permanecem no runtime existente.

As propostas são o conteúdo base completo seguido de três linhas UTF-8/CRLF. O teste remove apenas essas três linhas e exige o SHA-256 original de cada idioma; também exige que tenham sido apenas acrescentadas ao fim. Isso preserva todas as linhas antigas, inclusive comentários, ordem, parâmetros, `dbe.future.*`, staff, Kaioshin público, `other_world`, King Kai e Kaioken. Não houve rename adicional nem auditoria de assets/NPC.

## Hashes base e proposta

| Arquivo RP texts | SHA-256 base do checkout | SHA-256 proposta local |
|---|---|---|
| `pt_BR.lang` | `8b4bca56418417582a2e2befab3e13c3f51b3e148b09414dca7f410d9b94ee74` | `e1a5f49f4046d415d01908f44406ab7b62995e5868c7ccf6f1081038305feec5` |
| `en_US.lang` | `b033606e2026c68ad96c7377bb353704888eafda76b67d74751a5eca575f7fc7` | `b340d857030f80cd38c1891da12974c599bde113ec3a960dd2907c8616f4f8fa` |
| `es_ES.lang` | `c06f25978f5463bab00954f9927ad0adb617ed9c12ac4a98c67eb172ed6160c3` | `89151e717070ddc1baafff0d860370f11e5c8b46a0493405d6c5037ee8b0f8b3` |

Teste novo: base ausente; proposta SHA-256 `fe6c68a08dc21438588265656dbf7746fd7f0a435cfe1bc26e69fb1d6a5c1e53`. Relatório novo: base ausente; hash final externo no sidecar, evitando auto-hash.

Checkpoints runtime somente leitura, conferidos contra a entrega Runa: index `d37506c4490b342d94a5e362a3d74725184eed4873e8b07ab607bf7e15213dba`; Space `d807e4d908701832513c8bb5704fb992ca0dfe999d21eade75f4edd1f7e29e26`; travel_safety `bdf914e9f5db01d3359c1f5adf53f9ab16c9e64e86ac61f22ce1f851ff4fee71`.

## Validação executada e repetição

Node v24.22.0, PowerShell, execuções em série. Na raiz local, definir `DU_VISUAL_REFERENCE_ROOT` como o checkout readonly para carregar o reporter real; os idiomas continuam sendo as propostas locais.

1. `node --test --test-isolation=none --test-reporter=tap tools/test-visual-dimensions-1711.mjs` — **4/4**, exit 0, zero falhas/skips/cancelamentos. Três casos verificam preservação integral, unicidade, parâmetro e semântica; o quarto executa o reporter integrado e renderiza as três traduções. Inclui dispatch, geração, chegada pré-movimento, transação, teleporte e confirmação pós-movimento. O alias já existente Kaioshin produz somente `dbe:kai`; causas/estágios permanecem nos logs capturados.
2. No checkout readonly: `node --test --test-isolation=none --test-reporter=tap --test-name-pattern="Every Future feedback|Progress and inactivity|Cancelled and inactive" tools/test-future-feedback-179.mjs` — **3/3**, exit 0, zero falhas/skips/cancelamentos. Regressores existentes de parâmetros, ordem, continuidade, preservação e falha real. Foram executados sobre a base, cujas linhas Future continuam idênticas nas propostas, como prova o hash integral no teste novo.
3. No checkout readonly: `node --test --test-isolation=none --test-reporter=tap --test-name-pattern="Shared feedback deduplicates" tools/test-systems-dimensions-1711.mjs` — **1/1**, exit 0, zero falhas/skips/cancelamentos. Reutiliza a prova existente do limite de 100 ticks e da cadeia original, sem alterar runtime.
4. `node --check tools/test-visual-dimensions-1711.mjs` — exit 0.
5. `git -c core.autocrlf=false -c safe.directory=<checkout> apply --check --whitespace=error <patch absoluto>` no checkout readonly — exit 0, nenhuma aplicação. Aplicação somente em espelho dentro da raiz autorizada — exit 0; os cinco arquivos aplicados coincidem byte a byte com as propostas. O teste focado repetido no espelho passou **4/4**, sem somar rerun à cobertura distinta.

São **oito casos distintos aprovados nesta etapa**, sem somar reruns. Não repeti o gate Systems117/117, Content16/16, assets, NPC, World ou QA. Os controles negativos abaixo não contam como passes de produção. O teste novo também pode ser executado diretamente após integração, sem variável externa, pois o default é a raiz do próprio checkout.

## Evidência para o Coordinator: comparador histórico

O caso `The localization follow-up changes no existing entry from the frozen 1.7.8 pack`, em `tools/test-future-feedback-179.mjs:81`, exclui somente adições `dbe.future.*` e `dbe.quest.staff.*` antes de comparar com 1.7.8. Por isso rejeita as três chaves de viagem solicitadas, mesmo com todas as linhas anteriores byte a byte preservadas.

Executei o corpo original desse caso em VM com redirecionamento somente em memória dos três caminhos exatos de idiomas atuais para as propostas locais. O teste e a referência congelada foram lidos sem alteração. A asserção falhou pelas chaves novas `dbe.travel.failed.*`, como esperado; o probe verificou essa falha. O primeiro probe não selecionou o nome correto do caso e abortou antes de executá-lo; a seleção foi corrigida e a reprodução acima foi confirmada. O caso histórico não foi omitido de uma declaração de suíte completa: somente os três regressores de feedback foram contabilizados como aprovados.

**Ação de integração fora desta allowlist:** o Coordinator deve reconciliar explicitamente esse comparador para admitir somente as três novas chaves autorizadas, mantendo a comparação de todas as entradas anteriores. Não editar o arquivo congelado nem afrouxar a preservação. Este patch não modifica o teste antigo. Não há alegação de gate global verde ou resolução dos conflitos históricos/EPERM já reservados a QA.

## Aplicação, limites e texto para README

Comando de verificação no checkout: `git -c core.autocrlf=false -c safe.directory=<checkout> apply --check --whitespace=error <patch absoluto>`. Aplicar somente pelo Coordinator, depois de conferir os três hashes base. A proposta preserva CRLF dos idiomas; não converter finais de linha ao integrar. Checksums finais e evidência de aplicação em espelho local acompanham a entrega no sidecar e no handoff ao Coordinator.

Nenhuma edição do checkout integrado, script, JSON de dimensão, manifest, catálogo, asset, save ou arquivo 1.7.9/1.7.10. Nenhum commit, empacotamento, instalação, mudança de modelo, rotina ou acionamento de Crivo. O primeiro gerador recusou a entrada com acentos corrompidos pelo encoding de stdin antes de escrever arquivos; a escrita aprovada usou UTF-8 explícito e foi conferida por hashes/testes.

Ambiente informado: Minecraft 26.52 / Appx 1.26.5203.0 com APIs Beta e Próximo Recurso de Criador. Não há prova de carregamento/renderização pelo engine nem execução nativa nesta etapa; CUA pipe está indisponível. Em mundo novo ou cópia com backup, QA ainda precisa observar as mensagens nos três idiomas, ID físico real, legibilidade, falhas de dispatch versus lookup e confirmação posterior ao movimento. Não provocar essas falhas no único save do usuário.

> Visual Dimensions 1.7.11 — Prisma: acrescentadas somente dbe.travel.failed.lookup, preparation e teleport em pt_BR, en_US e es_ES, cada uma com um parâmetro de ID físico. As mensagens distinguem destino indisponível, falha ao iniciar/preparar a viagem e falha ao concluir/confirmar o teleporte, orientando consulta ao Content Log sem culpar versão, prometer segurança/origem fixa ou afirmar ausência de movimento. Todas as linhas anteriores dos idiomas foram preservadas, incluindo Future, staff e nomes públicos existentes. Passaram quatro casos focados novos e quatro regressores existentes selecionados; o comparador histórico de acréscimos de localização exige reconciliação explícita pelo Coordinator. Runtime, IDs, assets e saves não foram alterados. Engine e instalável continuam sujeitos a QA e auditoria posterior; esta etapa não anuncia prontidão para teste.
