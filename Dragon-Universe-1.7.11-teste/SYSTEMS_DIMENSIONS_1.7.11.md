# Systems — rotas e diagnósticos dimensionais 1.7.11

Forja, 27/10/2026. Nova liberação nominal após integração World; a tarefa NPC anterior não foi retomada. Proposta local para o Coordinator integrar no checkout existente. Nenhuma execução Minecraft, instalação, mudança de save, commit, reset, rotina ou empacotamento.

Diretório da entrega: `systems-dimensions-1711/`, nesta raiz autorizada. Fonte somente leitura: `C:/Users/rvmm2/Downloads/DragonUniverse1.7.1E/.maestri/roles/cac3a97f-f5cb-4647-a9f9-83558bb28155/.work/integration`.

Reabertura mínima antes da integração: os três bridges Space → Namek/U6/Kaioshin agora distinguem falha do comando `scriptevent` de falha de lookup. O contraexemplo executa os três corpos reais com `runCommand` lançando uma exceção de dispatch/permissão e sua causa original: há exatamente um comando e zero chamadas a `getDimension`. Os três casos falharam na proposta anterior e passaram após mudar somente os três contextos para `dispatch` e incluir esse estágio na categoria preparação. Sem fallback nem diagnóstico de dimensão ausente. A suíte focada final passa **49/49**; os gates 55/74 anteriores não foram repetidos nesta reabertura. O mesmo patch foi regenerado sobre as bases originais, ainda não aplicadas.

## Resultado

A restauração de `format_version` pertence à entrega World já integrada. Não encontrei motivo demonstrado para alterar IDs, criar dimensões alternativas, voltar a registrar as oito definições BP por script ou trocar o destino de uma rota. Corrigi defeitos reproduzidos no tratamento de falha, reserva de jogador, observação da viagem pelo menu, cache da preparação da Arena e diagnóstico de retorno. Isso não certifica que o loader real aceitou o BP.

O patch inclui somente seis scripts e um teste novo, na allowlist de `systems-dimensions-1711/hashes.json`. Bases, propostas, patch, 33 scripts originais e artefatos preservados têm SHA256 nesse manifesto. O `index.js`, runtime NPC, Future, `other_world_kai.js`, geração de terreno, reparo, dados Content, JSON BP, manifests, catálogos e idiomas não foram editados. Namek foi ajustado por ser caller delegado do mesmo navegador e por reproduzir os mesmos defeitos de origem/feedback; seu terreno permanece igual.

## Ambiente e autoridade

Alvo confirmado pelo usuário e pelo checkpoint: Minecraft 26.52, Appx 1.26.5203.0, APIs Beta e Próximo Recurso de Criador habilitados. Os manifests 1.7.11/minimum_engine 1.26.50/UUIDs/APIs foram preservados exatamente da baseline do Coordinator. Não deduzi incompatibilidade de build a partir de exceções.

O changelog oficial 26.50 documenta suporte a dimensões BP JSON, altura e bioma customizados. A documentação de `DimensionRegistry` descreve registro script-only no startup, gerador void e possibilidade de erro por registro duplicado. `World.getDimension` pode falhar para nome inválido; `Entity.teleport` é síncrono, pode lançar e não comprova por si só a chegada. Referências primárias recuperadas, URLs e limites estão em `systems-dimensions-1711/evidence/primary-sources.json`.

Decisão delimitada: manter os oito BP como autoridades declarativas, com a versão raiz restaurada por World. Preservar os quatro registros startup-only explícitos do core — Future, sala do tempo, Other World e torneio mundial — e os 50 espaços de cajado existentes. Nenhum subscriber/registro foi adicionado ou removido nesta proposta. Documentação e teste estático não demonstram a ordem privada do loader, nem disponibilidade real de uma dimensão; isso continua exigindo Minecraft.

## Traçado das rotas

| Entrada real | Encaminhamento existente | Lookup físico e preparo | Retorno existente preservado |
|---|---|---|---|
| Navegador/órbita/`dbe:space vegeta` | `travelTo(..., vegeta)` | `dbe:vegeta`, `prepareArea`, proveniência de buffer, `safeTeleport` com piso | `sendHome` Space, `safeReturnToEarth`, origem `dbe:namek_origin` |
| Navegador/órbita/`dbe:space frieza` | `travelTo(..., frieza)` | `dbe:frieza_planet`, mesmo protocolo | Mesmo retorno Space |
| Navegador/órbita/`dbe:space yardrat` | `travelTo(..., yardrat)` | `dbe:yardrat`, mesmo protocolo | Mesmo retorno Space |
| Navegador/órbita/`dbe:space kaioshin` | `scriptevent dbe:kaioshin` → `sendToKaioshin` | `dbe:kai`, `prepareArea`, `safeTeleport` com piso | Origem `dbe:kai_origin`; retorno salvo ou Terra segura, preservando origem compartilhada quando aplicável |
| Navegador/órbita `universe6`, convite ou `dbe:tournament` | `sendToArena` | `dbe:universe_6_arena`, `ensureArena`, `safeTeleport` com piso | Origem `dbe:u6_origin`; dimensão salva ou Terra segura |
| `dbe:hell` ou queda existente de Other World | `sendToHell` | `dbe:hell`, `prepareArea`, `safeTeleport`; a queda mantém sua política própria | Origem `dbe:hell_origin`; dimensão salva ou Terra segura |

Hell não é uma opção do Star Navigator atual; não acrescentei uma. `dbe:kaioshin` é o identificador lógico já resolvido para o armazenamento físico legado `dbe:kai`. Não há uma dimensão física nova com o nome lógico. Arena não é `dbe:universe6`, e Frieza não é `dbe:frieza`. A delegação Namek continua `dbe:namek`.

Nos módulos BP, o lookup ocorre em handlers pós-carregamento existentes. A rota continua exigindo leases, preparação real, piso/headroom, proveniência e confirmação posterior ao teleporte. Não há objeto que finja disponibilidade, fallback de registro ou redirecionamento de um destino ausente para outro. O fallback de retorno à Terra já existente continua limitado a terreno seguro antes de movimentar o jogador.

## Defeitos reproduzidos e correção localizada

1. **Reserva abandonada/rejeição escapando:** a captura da origem ocorria depois de reservar o jogador, mas fora do `try/finally`. Uma falha nativa de leitura deixava a reserva presa e rejeitava a chamada do handler. A origem agora é capturada dentro do bloco protegido, após lookup; Hell também protege sua leitura inicial de dimensão. Os caminhos de falha liberam a reserva e admitem nova tentativa. Kaioshin libera seu cooldown de tentativa falha; a deduplicação de feedback continua ativa.
2. **Diagnósticos sem ID/estágio e feedback inadequado:** o helper compartilhado anexava texto nativo ao chat; Hell/Arena/Namek sugeriam incompatibilidade de versão, e Kaioshin expunha o erro e sugeria retry mesmo sem destino carregado. O helper agora centraliza as três categorias abaixo e registra ID físico, estágio e cadeia original de exceções somente no Content Log. As rotas fornecem contexto nos lookups/preparos que antecedem `safeTeleport`. Sem duplicar avisos próprios de cada rota, falhas iguais são limitadas por jogador por 100 ticks; uma mensagem de causa diferente continua observável. Limite existente de oito níveis para causas e mapa limitado preservados.
3. **Promise da Arena permanentemente rejeitada:** o IIFE de `ensureArena` podia executar `finally` e limpar o cache antes de a atribuição externa armazenar sua rejeição síncrona. A próxima chamada recebia para sempre a mesma Promise rejeitada. Um único agendamento por microtask assegura que o cache foi atribuído antes da execução protegida; `finally` volta a liberar a preparação. Não alterei o gerador da Arena, versão de build, planta ou marcadores.
4. **Observação do menu:** `openMenu` agora aguarda sua viagem, incluindo preparação pendente, antes de soltar a reserva do menu. Falhas tratadas não viram rejeições soltas e outro clique não solta prematuramente a mesma operação.
5. **Causa e estágio do retorno:** `safeReturnToEarth` preserva a exceção original do último candidato falho. Erros de lookup da Terra recebem identidade/estágio. O helper marca falhas posteriores ao movimento; o retorno deixa de experimentar outros candidatos após uma chegada movimentada cuja prova falhou. Assim, uma falha posterior ao movimento não é reclassificada como simples preparo nem gera outro teleporte automático. Não forcei rollback para uma origem que talvez já não seja segura.

Foram revisados callers de `safeTeleport`, `safeReturnToEarth`, `TravelError`, `reportTravelFailure`, `travelOrigin`, `acquireLoadedArea`, `physicalDestinationId` e preparação registrada. Isso incluiu os seis módulos propostos e, somente para leitura, core/regiões/grupos/cajado/retorno, Future, reparo, estruturas e Other World. A assinatura antiga de três argumentos de `reportTravelFailure` permanece válida; os argumentos opcionais novos são ID e estágio de contexto. Erros do próprio helper carregam `destinationId` e seu estágio real; o marcador `afterTeleport` é transitório, sem mudança de save.

## Contrato para Prisma e Runa

Prisma implementará posteriormente, por liberação do Coordinator, estas três chaves em pt_BR/en_US/es_ES. **Uma substituição `%s` em cada chave**, recebida como `with: [ID_físico]`, sem formato numérico, sem exceção, stack ou versão. Não houve edição de lang nesta entrega; a integração dos idiomas é uma dependência antes de distribuir a candidata.

| Categoria | Chave exata | Uso e limite de significado |
|---|---|---|
| lookup | `dbe.travel.failed.lookup` | Falha de resolução/obtenção da dimensão. Orientar responsável a conferir Content Log/disponibilidade antes de usar o destino; não culpar a versão nem recomendar repetir uma rota incapaz de carregar. |
| preparação | `dbe.travel.failed.preparation` | Preflight/dispatch de comando, lease/carregamento, geração ou prova de piso/headroom antes do movimento; inclui persistência de intenção de retorno. Erro de comando/permissão não significa dimensão ausente. Não prometer que o jogador ainda está na mesma posição ou seguro. |
| teleporte | `dbe.travel.failed.teleport` | Chamada nativa, interrupção ou confirmação posterior ao movimento. Não afirmar que o jogador permaneceu na origem ou que nenhum teleporte aconteceu. |

Textos de intenção em português, para Prisma traduzir/revisar: lookup — “O destino %s não está disponível. Peça ao responsável pelo mundo para verificar o Content Log antes de usar esse destino.” Preparação — “Não foi possível iniciar a viagem ou preparar/validar a chegada em %s. Consulte o Content Log com o responsável pelo mundo.” Teleporte — “Não foi possível concluir ou confirmar a viagem para %s. Procure um local seguro e consulte o Content Log.” O ID é útil para identificar qual destino falhou; não deve ser traduzido ou interpretado como outro ID.

Estágios internos permanecem precisos: `lookup`; `dispatch`, `loading`, `generation`, `arrival`, `destination` ou `transaction` antes do movimento; e `teleport`/`interrupted`/falha marcada após movimento. `dispatch` é a tentativa de emitir o comando, não uma conclusão sobre registro/carregamento BP; a exceção original de permissão/dispatch permanece no log. Esses nomes aparecem no log, não como exceções no chat. As mensagens Future existentes e sua prioridade de causas `dbe.future.*` foram mantidas; não criar novas chaves Future nem trocar seus parâmetros nesta rodada.

Runa deve conferir a tabela de entradas/IDs e as referências de história/retorno contra os dados atuais, sem renomear IDs, redirecionar viagem, mudar progresso ou criar grant. Não existe nova interface de terreno ou conteúdo a integrar. Qualquer divergência causal de runtime volta a Forja pelo Coordinator; nenhum outro agente foi acionado nesta entrega.

## Evidência executada

Todos os testes foram executados com `node --test --test-isolation=none --test-reporter=tap`; não foi reexecutado o gate global421. Logs completos em `systems-dimensions-1711/evidence/`.

| Execução | Resultado e classificação |
|---|---|
| Suíte original de 46 testes contra scripts originais, sem overlay | `negative.tap`: 8/46 passaram, 38 falharam, exit1 esperado; demonstra contratos/falhas de origem, feedback, cache e retorno anteriores. Não é um teste do loader nativo. |
| Três bridges com falha de comando, antes/depois do ajuste mínimo | `dispatch-negative.tap`: 0/3 antes; `dispatch-positive.tap`: **3/3** depois, zero skips/cancelamentos. Em cada caso há zero lookups e a cadeia original de exceções é preservada. |
| Suíte focada final, incluindo os três casos novos | `positive.tap`: **49/49**, zero skips/cancelamentos. Seis rotas reais extraídas, IDs/constantes reais e helpers reais; fronteiras de UI, mundo, terreno e leases simuladas explicitamente. |
| Core/Earth returns, recovery QA178, Future feedback179 e runtime lifecycle179, entrega anterior à reabertura dispatch | `regressions-return-feedback.tap`: **55/55**, zero skips/cancelamentos, assertions originais intactas. Não repetido nesta reabertura nominal mínima. |
| Space native1710, World repair/lifecycle e Future travel/lifecycle QA179, entrega anterior à reabertura dispatch | `regressions-terrain-timeout.tap`: **68/74**, zero skips/cancelamentos. Nenhuma falha Space/World; cinco casos de subprocesso bloqueados por EPERM e um contrato antigo de feedback cru incompatível com esta solicitação. Não repetido nesta reabertura; não declarar o conjunto aprovado. |
| Future lifecycle QA179 na fonte original, sem overlay | `baseline-future-eperm.tap`: **10/15**, os mesmos cinco bloqueios de subprocesso. `spawn-classification.json` comprova `status:null`, `spawnSync node.exe EPERM` fora do runner. São verificações bloqueadas, não cinco aprovações nem um defeito novo atribuído à proposta. |
| Dois contratos históricos isolados, sem alterar testes | `historical-contract-conflicts.tap`: **0/2**, falhas mantidas e explicadas abaixo. Um desses dois já aparece nos 74; não somar duas vezes. |
| Sintaxe/aplicação/whitespace | Sete arquivos JS/MJS passam `node --check`; `git -c core.autocrlf=false apply --check --whitespace=error-all` passa contra o checkout original. |
| Preservação | 33 hashes de scripts e os dois manifests originais coincidem com a baseline1711; mcaddons179/1710 coincidem com os hashes preservados. |

Os dois contratos antigos incompatíveis são: `test-systems-native-1710.mjs`, caso “Future travel safety and the shared inactivity runner remain unchanged from the frozen 1.7.9 delivery”, que exige bytes idênticos do helper inteiro; e `test-future-travel-179.mjs`, caso “Other destination feedback remains unchanged and cyclic causes cannot loop forever”, que exige string contendo a exceção crua no chat. A nova tarefa autoriza mudar esse helper e exige eliminar tal exposição. Não alterei, enfraqueci, deletei ou escondi essas assertions/frozen179. O Coordinator/QA precisa reconciliar explicitamente esses contratos de versão antes de afirmar gate final verde. Os casos propriamente Future de parâmetros/prioridade continuam aprovados; os cinco subprocessos permanecem bloqueados.

Os testes novos cobrem também buffer incompleto sem chegada, piso inseguro sem movimento, retry após lease/preparo/teleporte falho, registro de retorno retido na falha, lease criado tardiamente após deadline e sua remoção, origem lida com exceção, cache Arena liberado, causa original no retorno esgotado e falha de chegada posterior ao movimento. Não houve afirmação de que dimensão mockada é engine ou de que provar um piso sintético valida um mundo real.

## Integração e limites

Conferir `hashes.json` e aplicar apenas `systems-dimensions-1711.patch` com `core.autocrlf=false` para preservar hashes entregues. O teste novo roda diretamente do checkout após integração, sem overlay ou variáveis. Para a verificação local, `DU_SYSTEMS_REFERENCE_ROOT` aponta ao checkout readonly; `DU_SYSTEMS_SCRIPTS_ROOT` seleciona a baseline no negativo. `overlay.mjs` é ferramenta local de revisão das suites antigas e redireciona somente os seis caminhos ativos exatos; jamais os congelados. Helpers Python, overlay, logs e classificação de spawn não entram no pack. Este relatório pode ser integrado em `docs/SYSTEMS_DIMENSIONS_1.7.11.md` pelo Coordinator.

Nenhum Minecraft está disponível nesta sessão (falha CUA pipe os error2 informada). Permanecem pendentes carregamento real das oito definições e biomas, IDs efetivos pós-load, limites reais de chunks, viagem e retorno nas seis rotas, passageiros/rideables e desconexão em mundo novo e cópia de backup. Erro de teleporte que não movimenta o jogador mantém a origem nos cenários modelados; quando o engine já movimentou e a confirmação falha, a proposta não inventa sucesso nem garante rollback seguro. Não houve benchmark do engine.

Antes de entregar instalável: integrar/rever patch, contratos Runa/Prisma, resolver os dois contratos históricos explicitamente e classificar EPERM com QA, depois executar gates disponíveis e a auditoria da candidata1711 sob o Coordinator. Não houve alteração dos artefatos179/1710 nem criação de1711. Aguardar nova liberação nominal após o handoff.
