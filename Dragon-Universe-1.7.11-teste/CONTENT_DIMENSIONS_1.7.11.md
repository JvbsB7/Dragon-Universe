# Content — destinos 1.7.11
Runa, 27/10/2026. **Sem defeito Content novo comprovado; nenhuma edição de dados ou runtime necessária.** Entrega: este relatório/tabela e dois testes contratuais novos. Sem patch de produção.

Fonte somente leitura: `C:/Users/rvmm2/Downloads/DragonUniverse1.7.1E/.maestri/roles/cac3a97f-f5cb-4647-a9f9-83558bb28155/.work/integration`. Li o início atual do Dragon Universe Contract, RESUME_1.7.11.md, DIMENSION_FIX_1.7.11_TRACKING.md e SYSTEMS_DIMENSIONS_1.7.11.md. Alvo confirmado: Minecraft 26.52 / Appx 1.26.5203.0, Beta APIs e Próximo Recurso de Criador ligados; addon 1.7.11, mínimo 1.26.50, UUIDs preservados. Versão do addon não deve ser comparada por igualdade à versão do jogo.

## Mapa do contrato real
Todos os oito destinos têm definição BP própria em `Dragon Universe_bp/dimensions/`; o nome de arquivo lógico não cria outro ID físico. Origem abaixo é propriedade do jogador, com dimensão/posição/rotação; destinos não são renomeados no armazenamento.

| Nome público | ID registrado / bioma se diferente | Entrada real / travel | Story atual | Persistência de origem | Retorno |
|---|---|---|---|---|---|
| Planeta Vegeta | `dbe:vegeta` | Navigator/órbita/`dbe:space vegeta` → Space `travelTo` | Sem referência nessas sagas | `dbe:namek_origin` | Terra pelo Navigator/`dbe:space earth`; atmosfera → Space |
| Planeta Frieza | `dbe:frieza_planet` / bioma `dbe:frieza` | Navigator/órbita/`dbe:space frieza` → `travelTo` | Saga Frieza usa **Namek**, não este planeta | `dbe:namek_origin` | Mesmo retorno Space/Terra |
| Yardrat | `dbe:yardrat` | Navigator/órbita/`dbe:space yardrat` → `travelTo` | Sem referência nessas sagas | `dbe:namek_origin` | Mesmo retorno Space/Terra |
| Planeta Kaioshin | **`dbe:kai`**, alias lógico `dbe:kaioshin` | Navigator/órbita/`dbe:space kaioshin` → `dbe:kaioshin` → `sendToKaioshin`; comandos legados `dbe:kai*` aceitos | `saga_majin_7`: enter_biome e in_biome lógicos Kaioshin → físico Kai | `dbe:kai_origin`; origem Terra compartilhada em `dbe:namek_origin` | `dbe:kaioshin_return` ou `dbe:kai_return`: origem salva, inclusive Other World, ou Terra segura; atmosfera → Space |
| Arena Universo 6 | **`dbe:universe_6_arena`** | Navigator/órbita/key `universe6` → `dbe:tournament` → `sendToArena`; uso de `dbe:tournament_invitation` | `saga_universe_6_1…6`: enter_biome/in_biome com ID físico da Arena | `dbe:u6_origin`; fallback de origem Terra em `dbe:namek_origin` | Convite dentro da Arena ou `dbe:tournament_return`: origem salva/Terra segura; atmosfera → Space |
| Hell / Inferno | `dbe:hell` | **Não está no Navigator**. `dbe:hell` → `sendToHell`; queda de `dbe:other_world` chama `sendToHell(player,true)` | Sem referência nas três listas de quests auditadas | `dbe:hell_origin`; queda registra chegada de Other World como retorno | `dbe:hell_return`: origem salva/Terra segura; subir ao limite de escape → Other World |
| Space / Estação Orbital (controle) | `dbe:space` | Navigator/`dbe:space space`/saída de atmosfera → `travelTo` | Sem referência nessas sagas | `dbe:namek_origin`, preservada ao transitar entre planetas | Navigator Terra/`dbe:space earth` → `safeReturnToEarth` |
| Namek (controle) | `dbe:namek` | Navigator/órbita/`dbe:space namek` → `dbe:namek` → `sendToNamek` | `saga_frieza_1…9`; chegada enter_biome em _1, gates in_biome em _1…9 | `dbe:namek_origin`; não sobrescreve casa ao vir de Space/Kai/Arena | `dbe:namek_return`: origem salva/Terra segura; atmosfera → Space |

Fontes: `space_planets.js:48,470,541,559,1670,1712,1837`; `kaioshin_dimension.js:32,42,739,759,787,837`; `universe_6_dimension.js:27,32,384,404,426,496,506`; `hell_dimension.js:30,40,340,411,454,468,504,549`; `namek_dimension.js:612,616,629,683`. Todos sob `Dragon Universe_bp/scripts/`.

## Decisões e compatibilidade
- `travel_safety.js:14` resolve somente o alias Kaioshin para `dbe:kai`. Isso é compatibilidade intencional de mundo salvo; não falta criar `dbe:kaioshin`. `universe6` é key do navegador, não ID físico.
- Não achei nome público ativo stale: labels dimension/biome/dest nos três idiomas dizem Kaioshin e mantêm equivalência do alias. A entrada da esfera em `other_world_kai.js:180` já diz Kaioshin; nomes técnicos/legados em comandos, logs e propriedades não justificam migração.
- Preservei Other World, região `king_kai_planet` (continua em `dbe:other_world`), King Kai, Kaioken, personagens e definições BP/RP de player/PK. Comparação somente leitura de **13 arquivos** contra o ZIP 1.7.10: zero divergências, incluindo sete arquivos de dados, other_world_kai.js, os dois player definitions e três idiomas. Não houve acesso a save.
- Varredura executável de main/side/challenge: referências especiais são Namek (13), Kaioshin (3), Arena (19), todas nas main quests; side/challenge não introduzem outros destinos dessa tabela. Regions usa Other World para King Kai; diálogos não acrescentam outro dimensionId/in_biome. Não confundir a saga Frieza com planeta Frieza.
- `index.js:13042` recarrega `quests_info.quests` pelo ID da missão e definição atual; `:13053` salva progresso. O teste novo executa esses métodos reais com um envelope de quest simulado, preservando snapshots de objetivos/tarefas, histórico e reinícios. O envelope não executa combate, recompensas ou objetivos: essa é uma prova da fronteira loader/serialização, não do gameplay inteiro.
- Os `enter_biome` reais em `index.js:18835` e predicate `in_biome` em `:19850` usam o mesmo resolvedor físico; os testes existentes cobrem os dois aliases Kai. O teste novo acrescenta todas as tarefas/gates reais Namek/Kaioshin/Arena e recusa Other World como substituto.
- Revisados menu geral/regiões/grupo/Angel Staff: `duTravel` e o retorno `staffDimensionId/staffLocation` usam a resolução física, com Terra segura para origem inválida. Oito testes core existentes passaram; nenhum registro persistido foi reescrito.
- As três novas keys `dbe.travel.failed.lookup/preparation/teleport` ainda têm **zero definições em cada idioma**. Dependência interina esperada de Prisma, não achado novo nem motivo para editar lang. Mantém-se um parâmetro `%s` com ID físico para suporte; não há pedido de outro ID ou nova camada de nomes. Diagnóstico técnico não deve virar nome público Kai errado.

## Provas executadas nesta etapa
Node v24.22.0; comandos com prefixo RTK do ambiente:
1. No checkout real: `node --test --test-isolation=none --test-reporter=tap tools/test-kaioshin-names-178.mjs tools/test-destination-refs-178.mjs tools/test-core-returns-178.mjs` → **14/14**, exit0, zero skips/cancelamentos.
2. Na raiz de Runa, `DU_CONTENT_ROOT` apontando ao checkout readonly: `node --test --test-isolation=none --test-reporter=tap tools/test-content-destinations-1711.mjs` → **2/2**, exit0, zero skips/cancelamentos. Total desta etapa: **16/16**.
3. `node --check tools/test-content-destinations-1711.mjs` → exit0.
4. Comparação ZIP/read-only citada acima → **13/13**, exit0. Arquivo 1.7.10 preservado: SHA256 `aa07e76d8b70a6cf845a81295138ab1aa1c7d1e95af71582c61d7c67e074aea5`.

Retomada manual nominal: contrato relido e os mesmos dois testes novos repetidos, **2/2**, exit0, zero falhas/skips/cancelamentos. O teste permaneceu com o mesmo hash; a auditoria não foi reiniciada e o total continua 16 testes distintos. Index, Space e travel_safety foram novamente conferidos com os hashes abaixo.

Não somei nem reexecutei o gate Systems/Coordinator 117/117, NPC135, assets ou QA anteriores.

## Integração e hashes
Allowlist de integração: somente dois arquivos novos, produzidos na raiz autorizada `C:/Users/rvmm2/Downloads/DragonUniverse1.7.1E/.maestri/roles/b07ba4cf-255f-4c89-998d-ac3ddd91210b`:
- `tools/test-content-destinations-1711.mjs` — SHA256 `78c67452dfa6bdd2109c1c2427e05c8d14fc557626f4f06244287cb7b2730d79`.
- `docs/CONTENT_DIMENSIONS_1.7.11.md` — este relatório; hash na mensagem de entrega para evitar auto-hash.

`CONTENT_DIMENSIONS_1.7.11.patch`, na mesma raiz autorizada, adiciona somente os dois caminhos dessa allowlist. Não há alteração de DADOS. Coordinator deve conferir hashes e `git apply --check --whitespace=error <patch absoluto>` antes de integrar, então executar o teste no checkout sem variável externa. Nenhum script de produção/import/helper, JSON, manifest, catálogo, idioma, artefato 1.7.9/1.7.10, save ou commit foi alterado. Os hashes finais do relatório e patch estão no handoff via Maestri.

Checkpoint readonly recebido e conferido:
- index: `d37506c4490b342d94a5e362a3d74725184eed4873e8b07ab607bf7e15213dba`.
- Space: `d807e4d908701832513c8bb5704fb992ca0dfe999d21eade75f4edd1f7e29e26`.
- travel_safety: `bdf914e9f5db01d3359c1f5adf53f9ab16c9e64e86ac61f22ce1f851ff4fee71`.

## Aceite nativo e limites
No alvo 26.52 confirmado, com par BP/RP 1.7.11 e experiências ligadas, validar em mundo novo/cópia com backup: oito IDs carregados; cada entrada real da tabela; retorno à origem/rotação e Terra fallback; caminho Other World→Hell→Other World e retorno Kaioshin; convite/Navigator Arena; continuação das sagas Namek/Kaioshin/Arena após salvar/reabrir. Confirmar que nenhum progresso, personagem ou PK foi reiniciado. Em falha, conservar ID/estágio/causa no Content Log e verificar feedback depois de Prisma. Número do addon ou JSON parseado não prova carregamento do jogo.

Sem execução Minecraft (pipe CUA indisponível), sem instalação, engine proof ou save test. Confirmação nativa, idiomas, QA, reconciliação dos contratos históricos/EPERM, pacote e auditoria final seguem pendentes. Nenhum outro agente acionado; nenhum aviso de pacote pronto. A próxima liberação pertence somente ao Coordinator.
