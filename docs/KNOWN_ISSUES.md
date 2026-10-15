# Problemas conhecidos

> Levantados na auditoria de 2026-10-14 por leitura de código. **Nenhum foi reproduzido dentro do Minecraft.**
>
> - **Confirmado**: o defeito é evidente no código.
> - **Possível**: depende de comportamento do motor/API ou de cenário específico; precisa de teste.
>
> Problemas no núcleo ofuscado (`scripts/index.js`) são localizados pelo subsistema, pois o arquivo é uma única linha. Problemas em arquivos legíveis trazem `arquivo:linha`.

Legenda de severidade: 🔴 crítico · 🟠 alto · 🟡 médio · ⚪ baixo

Legenda de situação: 🔧 corrigido no código, **aguardando teste no jogo** · ✅ corrigido e verificado no jogo · ❎ falso positivo (confirmado no código).

Verificação automática: `node tools/validate.mjs` (ver [README](../README.md#-validação-automática-tools)).

## 1. Confirmados

### C1 🔴 Perda silenciosa de progresso
- **Onde:** núcleo — banco de dados dinâmico (leitura do JSON salvo).
- **Comportamento:** se o JSON da dynamic property falhar no parse, o código usa `{}`; no próximo save o blob inteiro é sobrescrito.
- **Agravantes:** todo o estado do jogador está em uma única string (limite aproximado de 32 KB por propriedade); `completedQuests` recebe duplicatas a cada volta da saga principal e cresce sem limite.
- **Correção:** nunca sobrescrever após falha de parse; manter cópia de segurança; deduplicar `completedQuests`; dividir dados grandes em várias propriedades.
- **Validação:** teste com JSON corrompido injetado via `/dbe:data` ou script de depuração; verificar que o save original permanece.

### C2 🟠 Cooldowns persistidos quebram ao reabrir o mundo
- **Onde:** núcleo — gerenciador de cooldowns (tipo "elapsed_ticks").
- **Causa:** o início do cooldown é salvo com `system.currentTick`, que volta a 0 em cada sessão.
- **Impacto:** `rapid_movement`, guarda e regeneração de stamina podem ficar bloqueados por muito tempo após recarregar o mundo.
- **Correção:** usar tempo absoluto (`Date.now()`) ou salvar o tempo restante.
- **Validação:** ativar cooldown, sair e entrar no mundo, verificar se expira no tempo previsto.

### C3 🔴 Duplicação de Esferas do Dragão e cooldown burlável
- **Onde:** núcleo — gerenciador das Esferas.
- **Causa:** quando o total rastreado chega a 0 (todas recolhidas ou usadas), o conjunto é restaurado e reespalhado imediatamente; remoção com `splice` dentro de `for…of` pula elementos; `lastUsedAt` usa `system.currentTick`.
- **Impacto:** esferas duplicadas e invocações sem esperar o cooldown.
- **Correção:** reespalhar apenas após o cooldown, iterar de trás para frente, usar tempo absoluto.

### C4 🟠 Desejos sem trava em multiplayer
- **Onde:** núcleo — sessão de desejos.
- **Causa:** qualquer jogador abre uma sessão paralela; `wishes_made` é lido antes de o formulário fechar; cancelar ou não ter desejos elegíveis deixa a promessa pendente (o dragão não vai embora e o horário forçado não é restaurado).
- **Correção:** trava por invocação, recontar no envio, tratar cancelamento e lista vazia.

### C5 🔴 `/dbe:pay` aceita valor negativo
- **Onde:** núcleo — comando `dbe:pay` / `transferValue`.
- **Comportamento:** `/dbe:pay -1000 <jogador>` retira zeni do alvo e credita no autor; o saldo do alvo pode ficar negativo.
- **Correção:** rejeitar `amount <= 0`.

### C6 🔴 Backdoor por nome de jogador
- **Onde:** núcleo — inicialização do jogador.
- **Comportamento:** um jogador chamado `About04` recebe automaticamente o papel `creator` (e itens/permissões Patreon).
- **Correção:** remover; será tratado junto com a substituição do sistema Patreon.

### C7 🟠 Códigos de resgate forjáveis
- **Onde:** núcleo — decodificador de códigos (`/dbe:redeem`).
- **Causa:** o formato é apenas ofuscação (base64 + permutação) sem segredo; qualquer pessoa pode montar um código válido.
- **Decisão da equipe:** substituir pelo sistema próprio.

### C8 🟠 Ataques de ki tratados como golpe corpo a corpo
- **Onde:** núcleo — serviço de dano.
- **Causa:** o projétil aplica dano com `cause: entityAttack` em nome do dono; por isso recebe +força, multiplicador de combo, ×2.25 da raça Demon e gatilhos `on_hit`.
- **Também:** defesa calculada como `floor(dano / defesa)` — golpes fracos causam 0.
- **Correção:** marcar a origem do dano e separar os pipelines de ki e melee; garantir dano mínimo.

### C9 🟠 Custo por tick de toda entidade `dbe:*`
- **Onde:** núcleo — registro de entidades e `onTick` das skills.
- **Causa:** qualquer entidade cujo id começa com `dbe:` (orbs, veículos, props, `player_fly`) recebe um wrapper completo com intervalo de 1 tick; colisão entre ataques de ki é O(K²) por tick.
- **Impacto:** lag em áreas com muitas entidades (vilas, eventos).
- **Correção:** wrapper só para quem precisa; reduzir frequência; particionar colisões.

### C10 🟠 Integração Kai ↔ Espaço quebrada
- **Onde:** `space_planets.js:577` (`DESTS` sem `KAI_KEY`), `:869-876`, `:1195-1197`; código morto em `:916`, `:1625`; `other_world_kai.js:21` vs `space_planets.js:1317`.
- **Comportamento:** `/scriptevent dbe:space kai` só mostra a ajuda; não existe esfera do Kai no espaço; o retorno em y≥300 sempre dispara antes do lançamento ao espaço em y≥500.
- **Correção:** adicionar o destino Kai e unificar os limites de altura.

### C11 🟠 Origem de retorno corrompida
- **Onde:** `space_planets.js:1451-1458`, `namek_dimension.js:607`, `kai_dimension.js:697`, `universe_6_dimension.js:368`.
- **Comportamento:** `dbe:namek_origin` pode gravar uma posição no Kai ou no U6 como "casa"; depois, o destino "Terra" leva ao ponto de spawn.
- **Correção:** função única que só grava origem no overworld; centralizar a constante.

### C12 🟡 Ticking areas não removidas em caso de erro
- **Onde:** `kai_dimension.js:725-731`, `hell_dimension.js:476-481`, `namek_dimension.js:584-590`, `space_planets.js:1571-1599`.
- **Correção:** `try/finally` em torno do teleporte.

### C13 🟡 Limpeza global de golems
- **Onde:** `planet_villages.js:1044-1052`.
- **Comportamento:** a cada 200 ticks remove todo `dbe:demonic_iron_golem` em 6 dimensões, inclusive os invocados manualmente.
- **Correção:** restringir aos golems marcados pelas vilas.

### C14 🔴 Provável bloqueio da campanha em `saga_frieza_1` — 🔧
- **Onde:** `main_quests_data.js:421-422`.
- **Causa:** a tarefa exige o bioma `dbe:namek` na dimensão `minecraft:overworld`; esse bioma só existe na dimensão `dbe:namek`.
- **Correção aplicada:** `dimensionId: "dbe:namek"`. O `check-data` passou a apontar bioma de dimensão própria procurado em outra dimensão.
- **Validação:** jogar até a saga Freeza e entrar em Namek — **precisa ser confirmado no jogo**.

### C15 🟡 Som de carga cortado para todos — 🔧
- **Onde:** `Dragon Block_bp/animation_controllers/player_dbe.animation_controllers.json` (`stop_aura_sound`).
- **Causa:** `/stopsound @a`.
- **Correção aplicada:** `@s`.
- **Validação:** dois jogadores carregando ki; um para — o som do outro deve continuar.

### C16 🟡 Barra de ki vermelha invisível — 🔧
- **Onde:** `Dragon Block_rp/ui/hud_screen/stats_bar.json` (`ki_bar_root`).
- **Causa:** só havia painéis blue/green/pink/purple/yellow/white, embora `red` exista em `ki_colors_data.js` e a textura exista.
- **Observação:** o núcleo envia `auraProperties.kiBarColor` direto para a HUD (padrão `blue`); hoje nenhuma forma usa `red`, então o defeito não aparecia.
- **Correção aplicada:** painel `red_ki_bar` adicionado. O `check-data` valida `kiBarColor` contra os painéis da HUD.

### C17 🟡 Arquivos e textos
- 🔧 `Dragon Block_bp/blocks/decor/red_tile_slab.txt`: laje inacabada (sem loot, receita nem item) que nunca carregou. Movida para [`docs/wip/`](wip/README.md) e retirada do `contents.json`.
- 🔧 `Dragon Block_bp/contents.json`: listava `worldgen/structure_sets/city.txt` (inexistente) no lugar de `city.json`.
- 🔧 `dbe:medical_moss` era item e bloco ao mesmo tempo. O bloco da plantação passou a ser `dbe:medical_moss_crop` (id que já existia no `.lang`: `tile.dbe:medical_moss_crop.name`); sementes, feature de Namek e `blocks.json` atualizados; o item colhido mantém o id. **Mundos de teste:** plantações antigas de `dbe:medical_moss` viram bloco desconhecido.
- Texturas ausentes: `textures/ui/buttons/help_button(_hover)` (`ui/menus/menu_form.json`) — **precisa de arte**; `textures/ui/images/patreon_items` e `patreon_chat` (`ui/menus/news_form.json`) — ficam para a substituição do sistema Patreon (Fase 3).
- 🔧 `Dragon Block_rp/texts/en_US.lang:588`: chave com `saga.` duplicado.
- 🔧 Chaves só em pt_BR (saga Future Trunks e convite de mentor): traduzidas para en_US e es_ES — **revisão de texto recomendada**. Os três diálogos da Bulma em `saga_future_trunks_3` (objetivo 1) estão como `""` nas três línguas: **texto a escrever**.
- 🔧 Geometrias `kale_hair` e `trunks_hair` definidas duas vezes: removidas as cópias de `legacy_hairs/` (nenhuma entidade usa essas duas geometrias).
- 🔧 `items/music_disc_hero.json` com `format_version: "beta"` → `1.26.4`.

### C18 🟡 Dados inconsistentes / conteúdo inacessível
- Raças `glind` e `android` referenciadas mas ausentes em `races_data.js`. 🔧 Desativado o que quebrava: desejo `change_race` "glind" da Porunga e a recompensa de raça da `android_conversion` (a missão segue dando zeni). **Pendente (Fase 5):** Zamasu, Zamasu Fusionado e Zamasu Fusionado Corrompido continuam com `race: "glind"` e `gigantification` exclui `glind`.
- ❎ `ki_protect` (Kami-sama) e `metamoran_dance` (Goku): **são acessíveis**. O núcleo registra diálogos próprios desses NPCs com submenu de skills (`kami_sama_skills`; `goku_skills`, que exige ser discípulo do Goku). Registrado em `tools/lib/allowlist.mjs`.
- `makankosappo` com preço, mas sem treinador: é recompensa do desafio `piccolo_trial`; o preço não é usado. Decidir se deve ser exclusiva do desafio.
- ❎ `kiBarColor: "white"`: não é cor de `ki_colors_data.js`; o valor vai direto para a HUD, que tem o painel `white`.
- 🔧 Sagas Future Trunks usavam `entityDefinitions.attributes` (o núcleo só lê `powerDefinition`; os chefes nasciam sem atributos e sem nível recomendado). Convertido para `powerDefinition.level` preservando o total de pontos pretendido — o núcleo distribui `(ATTRIBUTE_POINTS_PER_LEVEL + SKILL_POINTS_PER_LEVEL) × nível × 1,1` pontos: Goku Black 102 e 125, Zamasu 136, Zamasu Fusionado 159, Corrompido 170. **Validar o balanceamento no jogo.**
- `absorption` e `gigantification` restringem raças por lista de exclusão — raças novas ganham acesso automaticamente.

### C24 🟡 Achados da validação automática (2026-10-15)
- 🔧 `final_flash` usava os sons `skill.final_flash_launch` e `skill.final_flash_gun`, que não existiam: a skill não tinha som. Eventos criados em `sound_definitions.json` reaproveitando os arquivos do Galick Gun (trocar quando houver áudio próprio).
- 🔧 `saga_universe_6_1`: os dados têm 5 objetivos, mas os `.lang` usavam a numeração anterior (sem o objetivo `enter_biome`); os diálogos do Goku e o de conclusão apareciam como chave crua. Chaves renumeradas nas três línguas.
- Chaves `quest.battle_jacket_return.*` nas três línguas sem missão correspondente nos dados (missão removida ou não implementada).
- `entities_data.js` `dbe:frieza`: forma `mecha_frieza` sem multiplicadores e fora das formas de `frost_demon`.
- `Dragon Block_rp/.png`: PNG 16×16 com nome vazio na raiz do RP (listado no `contents.json`).
- Entidades do BP sem `client_entity` (invisíveis): `dbe:test_enemy`, `dbe:player_fly`, `dbe:location` — provavelmente intencional.
- Sons sem evento em `sound_definitions.json`: `sounds/ui/exit`, `sounds/ui/kaioken`, `sounds/ui/sair`.

### C19 🟠 Vazamento de intervalos na `capsule_991`
- **Onde:** núcleo — veículo `dbe:capsule_991`.
- **Comportamento:** cria 2 intervalos por tick por instância que nunca são limpos; deixa uma action bar de depuração ("Center/Speed/PitchDiff/RollDiff").

### C20 🟡 Formulários sem tratamento de `UserBusy`
- **Onde:** núcleo — todos os formulários.
- **Comportamento:** menus abertos com o chat aberto somem; o formulário de customização entra em laço pedindo a cada tick.

### C21 🟡 Exploits em diálogos e skills
- Botões com requisito ou cooldown falho continuam clicáveis e o clique não revalida.
- Camisa de treino do Goku sem cooldown (itens infinitos).
- Menu de skills cobra pontos mesmo se a skill já foi aprendida.

### C22 ⚪ Versões de formato
- Dimensões em `format_version 1.26.50` com `min_engine_version 1.26.40`. Com a versão-alvo 26.52 isto não deve afetar; revisar o `min_engine_version` ao alinhar com 26.52.
- 40 itens vanilla sobrescritos em `format_version 1.10`.

### C23 ⚪ Outros do núcleo
- Clear lag ligado por padrão apaga todos os itens no chão a cada 15 min (inclusive esferas e recompensas).
- Dimensões Angel Staff limitadas a 49 jogadores.
- `/dbe:showform quest` sem argumento lança erro.
- Compra de atributo nunca atinge o máximo exato.
- Rótulo do anunciador do torneio some após recarregar o mundo.
- `processOnHitTriggers` não recalcula stats após maestria `on_hit`.
- Erros de `trySetProperty` são engolidos (forma > 31, raça fora do enum ou `charging_attack` > 15 falham em silêncio).

## 2. Possíveis riscos (precisam de teste)

| # | Risco | Onde |
|---|---|---|
| P1 | Execução restrita: wrapper criado dentro de `beforeEvents.entityHurt`; comandos que alteram o mundo sem `system.run`; handler async em `beforeEvents.playerInteractWithEntity` | núcleo |
| P2 | Sem handler de saída de jogador: alterações dos últimos 20 ticks podem se perder; reconexão rápida pode reutilizar instância inválida | núcleo |
| P3 | `getBlock` em chunk descarregado pode lançar `LocationInUnloadedChunkError`, gerando spam nos scanners | scripts de dimensão |
| P4 | Crescimento ilimitado: uma dynamic property por chunk gerado e por vila; caches e mapas por jogador nunca limpos | núcleo, `planet_villages.js`, scripts de dimensão |
| P5 | Vilas com 35–45 aldeões a cada ~160 blocos (hostis em Vegeta/Freeza) — maior risco de lag | `planet_villages.js` |
| P6 | Torneio: estado só em memória, partidas sem timeout; reinício deixa jogadores presos | núcleo |
| P7 | `defeat_enemy` conta abates de qualquer jogador do mesmo tipo de inimigo | núcleo |
| P8 | Ids de tarefa dependem do índice: alterar a ordem dos dados de missão pode corromper progresso salvo | núcleo |
| P9 | APIs beta (`beforeEvents.entityHurt`, `playerSwingStart`, `entityStartSneaking`, containers, `watchdogTerminate`) e componentes recentes (`free_camera_controlled`, `dash_action`) podem mudar entre versões | núcleo, `player_fly.json` |
| P10 | Geração síncrona pesada na primeira entrada (`findSpawn` até r=800, até 40000 tentativas para Esferas de Namek) pode acionar o watchdog | `namek_dimension.js:262` e geradores |
| P11 | Líquidos colocados na borda de chunks ainda não gerados escorrem para o vazio | scripts de dimensão |
| P12 | Comandos `/dbe:group.*` sem `cheatsRequired: false` podem não funcionar em mundos sem cheats | núcleo |

## 3. Balanceamento

| Item | Situação |
|---|---|
| `true_oni_rage` (Demon) | 7.6× no nível 100 — ~1,8× a `beast` |
| Kaioken tier 6 | ×10 sem restrição de forma; multiplicadores acumulam (oni 7.6 × kaioken 10 ≈ 76×) |
| `ultimate_form` | 3.1× sem dreno de ki no nível 60 |
| `lssj` | 3.25 no nível 32; com passiva `legendary` ≈ 4.5× |
| Formas mais fracas que anteriores | `golden_oozaru` (2.1), god do Earthling (2.6) |
| `ki_consume` invertido | várias formas avançadas gastam menos ki que a anterior |
| Demon | sem acesso às transformações globais |
| Multiplicador Demon no melee | ×2.25 fixo (patch no núcleo) |

Recomendação: definir regras de acumulação (base → aditivos → multiplicadores agrupados → teto) antes de adicionar títulos e passivas.

## 4. Duplicação de código (scripts de dimensão)

| Função/conceito | Cópias |
|---|---|
| Ruído (`hash2`, `mulberry32`, `valueNoise`, `fbm`) | 6 |
| `runJobAsync` | 6 |
| `rememberOrigin` / `sendHome` | 5 |
| Fog de entrada/saída | 5 |
| `chunkState`, `terrainJob`, `scan`, `prepareArea` | 4 |
| Geradores de esfera | 4 |
| Constante `dbe:namek_origin` | 4 |
| `withArea` / `withLoadedArea` | 3 |

Também: `final_flash` e `galick_gun` têm dados idênticos; `burst_move` e `rapid_movement` são equivalentes nos dados.
