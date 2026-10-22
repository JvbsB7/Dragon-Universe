# Arquitetura técnica — Dragon Universe

> Documento gerado a partir da auditoria da Fase 1 (somente leitura). Descreve o estado **atual** do código herdado do *Dragon Evolution* (About04), não o estado desejado. Nada aqui foi testado dentro do Minecraft; as descrições vêm da leitura do código.

## 1. Visão geral

A addon é composta por dois packs que dependem um do outro:

| Pack | Pasta | UUID do header | Função |
|---|---|---|---|
| Behavior Pack | `Dragon Universe_bp/` | `30f1e0c0-ded2-4f7d-b101-6863a4d94abe` | Lógica: scripts, entidades, itens, blocos, dimensões, receitas, loot, worldgen |
| Resource Pack | `Dragon Universe_rp/` | `23e2b6e9-db10-4e77-995a-1a1ce5bcd96c` | Visual e áudio: modelos, texturas, animações, partículas, sons, UI, textos |

- Versão dos packs: `1.7.1` (era `1.6.17` na base original; subir a versão a cada pacote distribuído, senão o Minecraft mantém o pack antigo instalado). `min_engine_version`: `[1, 26, 40]`.
- Script API: `@minecraft/server` **`beta`** e `@minecraft/server-ui` **`beta`** (exige o experimento *Beta APIs*; APIs beta podem mudar a cada atualização do jogo).
- Namespace de todo o conteúdo: `dbe:` (de *Dragon Block Evolution*). **Não renomear** — ids salvos em mundos existentes dependem dele.
- Versão-alvo do jogo definida pela equipe: **Bedrock 26.52**.

## 2. O núcleo (`scripts/index.js`)

O núcleo veio do autor original passado por um *bundler* e por um ofuscador: ~1,39 MB numa única linha, com todos os textos numa tabela embaralhada. Na Fase 3 (passo 1) ele foi convertido por `tools/deobfuscate-core.mjs` numa versão **legível e equivalente** (~19.600 linhas, ~790 KB): textos decodificados, `obj["x"]` → `obj.x`, números em decimal, tabela e decodificador (código morto) removidos e formatação com o Prettier. A versão ofuscada continua no histórico do Git (commit `2d4f628`).

O que continua difícil:

- Os **nomes de variáveis** curtos (`sG`, `i3`, `hO`, `bF`...) vieram do ofuscador e não podem ser recuperados; serão renomeados aos poucos (Fase 3, passo 2).
- Quase toda a lógica de jogo vive nesse arquivo: combate, atributos, raças, transformações, skills, voo, treino, missões, NPCs, lojas, Esferas do Dragão, desejos, comandos, HUD e persistência.
- Toda mudança que não deve alterar a lógica (renomear, extrair módulos) deve passar por `node tools/compare-scripts.mjs`, que carrega a versão anterior e a atual com um `@minecraft/server` falso e compara todas as chamadas feitas ao jogo.
- Já existem patches inseridos diretamente no bundle (Maçã Demoníaca, recompensa de raça, multiplicador Demon ×2.25, bônus Glind ×1.1, XP por dimensão, zeni por abate). Eles dependem de nomes internos ofuscados (ex.: `i3.getDBEEntity`) e quebram se o bundle for regenerado.

Os nomes "descritivos" usados abaixo foram dados durante a auditoria; o código não usa esses nomes.

## 3. Mapa dos sistemas

```
index.js (núcleo, legível desde a Fase 3)
 ├─ importa config/config.js e data/*.js (dados legíveis)
 ├─ importa os módulos de dimensão legíveis:
 │    kai_dimension.js ──► space_planets.js ──► planet_villages.js
 │    other_world_kai.js
 │    hell_dimension.js ──► hell_terrain.js, planet_villages.js
 │    universe_6_dimension.js
 │    namek_dimension.js (exporta namekDragonBallSpot)
 │
 ├─ Banco de dados dinâmico ── 1 JSON por entidade em dynamic property
 ├─ Registro de entidades (getDBEEntity) ── wrapper p/ Player e toda entidade "dbe:*"
 │    ├─ Atributos ─► Modificadores (multiplicativos) ─► Stats
 │    ├─ Recursos: Vida, Ki, Stamina
 │    ├─ Skills (toggle e ki_attack genéricos, por dados)
 │    ├─ Transformações (por raça + globais)
 │    ├─ Guarda / Esquiva / Combo, Cooldowns, Maestrias
 │    └─ IA de combate (NPCs e inimigos)
 ├─ Hub de eventos: loop global a cada tick + inscrições do mundo
 ├─ Missões, Conquistas, Mestres, Diálogos, Loja, Zeni
 ├─ Esferas do Dragão e Desejos, Torneio, Alinhamento, Grupos/Claims
 ├─ HUD (tokens em title/subtitle) e formulários (server-ui)
 └─ Comandos /dbe:* e scriptevents de registro
```

### 3.1 Comunicação entre servidor (script) e cliente (RP)

| Canal | Como funciona | Onde |
|---|---|---|
| **Propriedades de entidade** `dbe:*` (`client_sync`) | O script grava; animações e render controllers do RP leem. Ex.: `dbe:race`, `dbe:transformation` (0–31), `dbe:fly_mode`, `dbe:charging_attack` (-1–15), `dbe:aura_type`, `dbe:kaioken`, cores e customizações | `Dragon Universe_bp/entities/player.json` |
| **HUD por title/subtitle** | O script envia `title` com pares `chave:valor` (ex.: `ki_bar_frame:32`, `technique_slot_1:kamehameha`) e `subtitle` com um valor numérico por vez. A JSON UI testa se o texto contém cada token e mostra a imagem correspondente | `Dragon Universe_rp/ui/hud_screen.json`, `ui/custom_hud_screen.json`, `ui/hud_screen/*`, `ui/common/*` |
| **Roteamento de formulários** | O título do `ActionFormData` é uma chave de idioma `ui.dbe.*`; `server_form.json` compara o título e troca o layout vanilla pelo layout customizado | `Dragon Universe_rp/ui/server_form.json`, `ui/menus/*` |
| **Animation controllers do BP** | `climb_korin_tower` (levitação em coordenadas fixas) e `stop_aura_sound` | `Dragon Universe_bp/animation_controllers/player_dbe.animation_controllers.json` |

Limitação do HUD: qualquer `/title` disparado por outro sistema apaga o estado do HUD até a próxima atualização.

### 3.2 Persistência

- Cada entidade gerenciada guarda **um único JSON** na dynamic property `dbe` (atributos, skills, modificadores, cooldowns, maestrias, vida/ki/stamina, nível, cores, transformações desbloqueadas, missões, zeni, alinhamento…).
- O jogador também tem a store `server` (códigos resgatados, papéis).
- No mundo: stores `dragon_evolution` (Esferas, códigos, etc.), `regions`, `groups`, `structures`, `angel_staff_dimension(_owners)` e uma dynamic property por chunk gerado (`generated:*`) e por vila.
- Gravação com *debounce* de 20 ticks após qualquer alteração; `saveAllInstances` no `shutdown`.
- **Raça e transformação atual** persistem apenas como propriedade de entidade (`dbe:race`, `dbe:transformation`). O índice de transformação é **posicional** na lista da raça.
- **Não renomear** as chaves `dbe`, `dragon_evolution`, `server` etc. sem uma rotina de migração — os saves existentes seriam perdidos.

### 3.3 Atributos e dano

- Atributos base: `constitution`, `dexterity`, `spirit`, `strength`, `willpower` (limites e custo em `config.js`).
- Todos os modificadores (raça, skills ativas, transformação, fusão, `modifiers_data`) são **multiplicativos**: `valor final = base × Π multiplicadores`. Não há teto global — ver `KNOWN_ISSUES.md` (balanceamento).
- Fórmulas principais: HP = con×20; Ki máx = spi×50; defesa = dex/500+1; dano melee = str; dano recebido = `floor(dano / defesa)`.
- Gravidade `g` (pesos, Gravity Machine, Sala do Tempo) divide velocidade, salto e voo por `(g+1)` e multiplica o XP.
- Dano processado em `world.beforeEvents.entityHurt`; a vida vanilla é mantida cheia e a vida real é controlada pelo script.

### 3.4 Entradas do jogador (hardcoded no núcleo)

| Entrada | Efeito |
|---|---|
| Item `dbe:menu` (slot 9) | Abre o último menu; selecionado = postura de guarda |
| Item `dbe:functions` (slot 8) + Shift segurado | Carrega a barra e transforma ao soltar com 100% |
| Item `dbe:techniques` (slot 7) | Segurar = carregar ataque de ki; soltar = disparar; golpear = trocar técnica |
| Shift | Carregar ki; também desmonta o voo |
| Pulo duplo | Inicia o voo |

Qualquer mecânica nova baseada em Shift (ex.: treino de flexões) precisa considerar esses conflitos.

### 3.5 Tarefas recorrentes relevantes para desempenho

| Tarefa | Período | Observação |
|---|---|---|
| Loop global do hub de eventos | 1 tick | Percorre todas as entidades gerenciadas; subtarefas a cada 20/100/600 ticks; colisão entre ataques de ki O(K²) |
| `onTick` de skills por entidade | 1 tick | Roda para **toda** entidade `dbe:*` (inclusive orbs, veículos, props) |
| IA de combate | 20 ticks | Por NPC/inimigo |
| Ki do jogador | 5 ticks | Carga, drenagem, desfaz transformação sem ki |
| HUD | 5 ticks por jogador | Fila de title/subtitle |
| Scanners de dimensão | 4–10 ticks | 6 scanners independentes, cada um percorre todos os jogadores |
| Limpeza de golems | 200 ticks | `planet_villages.js:1044` |
| Clear lag | contador de 15 min | Ligado por padrão (`SERVER_MODE.CLEAR_LAG`) |

## 4. Módulos legíveis

### 4.1 Dados (`Dragon Universe_bp/scripts/data/`)

Consumidos pelo núcleo. É a **principal via de extensão sem tocar no núcleo**.

| Arquivo | Export | Conteúdo |
|---|---|---|
| `races_data.js` | `races_data` | 7 raças: multiplicadores, regen, customização, skills padrão, transformações (objeto ou id de transformação global) |
| `global_transformations_data.js` | `global_transformations_data` | `ultimate_form`, `beast`, `ultra_ego` |
| `skills_data.js` | `skills_data` | 29 skills (`ki_attack` e `toggle`), tiers, custos, treinadores (`availableTrainers`) |
| `modifiers_data.js` | `modifiers_data` | `saiyan_tail`, `oni_blessing` |
| `entities_data.js` | `entity_data` | 102 entidades: raça, escala, skills, nível/foco de atributos, transformações dos chefes |
| `main_quests_data.js` | `main_quests_data` | 47 missões principais (ordem do array = ordem da campanha) |
| `side_quests_data.js` / `challenge_quests_data.js` | — | 5 secundárias / 3 desafios |
| `masters_data.js` | `masters_data` | Mestre Goku e seus 4 trials |
| `dialogues_data.js` | `dialogues_data` | 17 diálogos de NPC, submenus de skills/loja/mentor |
| `shop_data.js` | `shop_data` | Lojas da Bulma, Chi-Chi e de roupas |
| `wish_data.js` | `wish_data` | 22 desejos (troca de raça, item, skill, cauda) |
| `dragon_balls_data.js` | `dragonBallsData` | Conjuntos Shenron (overworld) e Porunga (Namek) |
| `achievements_data.js` | `achievements_data` | 11 conquistas |
| `regions_data.js` | `regionsData` | 10 regiões (Lookout, Sala do Tempo, Kami, Korin, Other World, torneio…) |
| `tournaments_data.js` | `tournaments_data` | Torneio de Artes Marciais |
| `ki_colors_data.js` | `ki_colors_data` | Cores de ki |
| `variables.js` | `variables` | Posição do Lookout |

Tipos de requisito aceitos pelos dados: `has_level`, `has_skill`, `has_modifier`, `time_of_day`, `is_skill_enabled`, `has_mastery`, `is_alignment`, `is_race`, `is_transformation`, `in_biome`, `completed_quest`, `has_quest`, `has_master`.

Tipos de tarefa de missão: `enter_region`, `enter_biome`, `interact_npc`, `defeat_enemy`, `learn_skill`, `requirement`, `use_training_weight`, `collect_item`, `consume_ki`, `ki_charge`, `battle_power`, `unlock_transformation`.

Tipos de recompensa: `zeni`, `z_points`, `alignment_question`, `give_quest`, `race`, `item`, `skill`, `points`, `friendship_points`.

### 4.2 Configuração (`scripts/config/config.js`)

Objeto `CONFIG` com limites de atributo, custo de atributo, itens banidos em containers, cooldown do treino de concentração, dimensões proibidas para claims, multiplicadores de fusão, blocos indestrutíveis, progressão de nível, multiplicadores de recompensa, modos de servidor (`CLEAR_LAG`, `CUSTOM_CHAT`, ranking), cooldown da Sombra de Treinamento e stamina.

### 4.3 Dimensões (`scripts/*.js`)

Todas as 8 dimensões JSON (`Dragon Universe_bp/dimensions/`) são `void`; **o terreno é gerado 100% por script**, chunk a chunk, à medida que jogadores se aproximam. Bedrock em y=-64 serve de marcador de "chunk gerado/decorado".

| Arquivo | Dimensão | Responsabilidade |
|---|---|---|
| `kai_dimension.js` | `dbe:kai` | Planeta do Senhor Kaioh (terraços, rios, árvores, bolhas no céu); scriptevents `dbe:kai`, `dbe:kai_return`, `dbe:kai_sky` |
| `other_world_kai.js` | (Other World) | Esfera de acesso ao Kai no Outro Mundo; retorno ao subir a y≥300 |
| `hell_dimension.js` + `hell_terrain.js` | `dbe:hell` | Inferno, Portão do Inferno, vilas; acesso caindo abaixo de y-48 no Other World ou por scriptevent |
| `namek_dimension.js` | `dbe:namek` | Terreno, mar, vilas por estrutura, Esferas de Namek, moradores; acesso pelo `dbe:namek_space_pod` |
| `space_planets.js` | `dbe:space`, `dbe:vegeta`, `dbe:frieza_planet`, `dbe:yardrat` | Estação orbital, Space/Saiyan Pod, menu Star Navigator, planetas |
| `planet_villages.js` | (Vegeta, Freeza, Yardrat, Hell) | Vilas determinísticas, aldeões, golem demoníaco |
| `world_structures.js` | `minecraft:overworld` | Estruturas únicas/limitadas (Casa do Kame, Casa do Goku, Arena do Cell, Nave do Babidi, 3 West City, 5 cidades), planejadas pela semente e colocadas por script; `/scriptevent dbe:structures` |
| `universe_6_dimension.js` | `dbe:universe_6_arena` | Arena do Torneio dos Destruidores; acesso pelo `dbe:tournament_invitation` |

O núcleo registra ainda, sem JSON próprio: `dbe:other_world`, `dbe:hyperbolic_time_chamber`, `dbe:future_trunks`, `dbe:world_martial_arts_tournament` e `dbe:angel_staff_dimension_0..49`.

Há grande duplicação entre esses arquivos (ruído, geração de chunk, viagem, origem). Ver `KNOWN_ISSUES.md`.

## 5. Onde adicionar ou modificar conteúdo

| Quero… | Só dados? | Onde |
|---|---|---|
| Ajustar raça (multiplicadores, regen, skills iniciais) | Sim | `scripts/data/races_data.js` |
| Nova transformação | Parcial | `races_data.js` ou `global_transformations_data.js`; **acrescentar no fim da lista** (índice posicional, limite 0–31 em `player.json`); visual no RP |
| Nova raça | Não | `races_data.js` + enum `dbe:race` em `entities/player.json` + render controllers/texturas no RP + `wish_data.js` se trocável por desejo |
| Novo ataque de ki | Sim (se o tipo existir) | `skills_data.js` (`type: "ki_attack"`, `beam`/`blast`/`disc`); `propertyIndex` ≤ 15; animação/partículas no RP |
| Nova técnica (toggle/passiva) | Sim, se for só multiplicador/dreno | `skills_data.js` (`type: "toggle"`); comportamento novo exige código |
| Novo NPC com diálogo | Sim | Entidade no BP/RP + `dialogues_data.js` (`npcId` = typeId) + `entities_data.js` se luta |
| Novo mestre | Sim | `masters_data.js` + diálogo com submenus `mentor_invite`/`skills` + `availableTrainers` |
| Nova missão | Sim (tipos existentes) | `*_quests_data.js` + chaves `quest.<id>.*` nos três `.lang` |
| Item de loja | Sim | `shop_data.js` + `shop.item.<id>` nos `.lang` |
| Novo desejo | Sim (tipos existentes) | `wish_data.js` + `wish.<nome>` nos `.lang` |
| Novo conjunto de Esferas | Quase | `dragon_balls_data.js` + bloco com componente `dbe:dragon_ball`; posicionamento especial é hardcoded |
| Conquista | Sim | `achievements_data.js` |
| Nova dimensão/planeta | Não | JSON em `dimensions/`, bioma BP/RP, script gerador (ver padrões existentes), destino no Star Navigator |
| Textos | Sim | `Dragon Universe_rp/texts/{en_US,es_ES,pt_BR}.lang` — manter as três línguas sincronizadas |
| Regras de dano, voo, entradas, fórmulas | **Não** | `scripts/index.js` (legível; nomes de variáveis ainda curtos) |

Existem scriptevents de registro em tempo de execução (`dbe:quest_registry`, `dbe:dialogue_registry`, `dbe:entity_registry`, `dbe:modifier_registry`, `dbe:shop_registry`) que aceitam JSON; eles não validam a origem nem tratam JSON inválido.

## 6. Decisões arquiteturais registradas

| Data | Decisão | Motivo |
|---|---|---|
| 2026-10-14 | Versão-alvo: Bedrock 26.52 | Definido pela equipe |
| 2026-10-14 | Não renomear namespace `dbe:` nem chaves de persistência sem migração | Compatibilidade com mundos existentes |
| 2026-10-14 | Sistema Patreon do autor original será substituído por um sistema próprio da equipe | Definido pela equipe |
| 2026-10-16 | Núcleo convertido para versão legível equivalente (Prettier como ferramenta de desenvolvimento em `tools/`); renomeação de símbolos aos poucos | Aprovado pela equipe; equivalência verificada com `tools/compare-scripts.mjs` |
