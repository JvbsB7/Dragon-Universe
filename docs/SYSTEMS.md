# Inventário de sistemas e conteúdo

> Estado levantado na auditoria de 2026-10-14 por leitura de código e dados. "Implementado" significa que o código existe e parece completo — **não** que foi testado no jogo.

## 1. Resumo por sistema

| Sistema | Estado | Onde |
|---|---|---|
| Raças (7) | Implementado | `data/races_data.js` |
| Transformações por raça + globais | Implementado | `data/races_data.js`, `data/global_transformations_data.js` |
| Skills (29): ataques de ki, técnicas, passivas | Implementado | `data/skills_data.js` + núcleo |
| Atributos, nível, pontos de atributo/skill | Implementado | núcleo + `config.js` |
| Vida, Ki, Stamina, guarda, esquiva, combo | Implementado | núcleo |
| Voo | Implementado (frágil) | núcleo + `entities/player_fly.json` |
| Treino de sombra | Implementado | núcleo + `entities/opponents/shadow_dummy.json` |
| Treino de concentração | Implementado | núcleo + `entities/training_orb.json` + `rp/ui/menus/training_form.json` |
| Pesos de treino, Gravity Machine, Sala do Tempo | Implementado | núcleo + `items/weights/`, `blocks/gravity_machine.json` |
| Missões principais / secundárias / desafios / mentor | Implementado | `data/*_quests_data.js`, `data/masters_data.js` |
| Diálogos, lojas, zeni | Implementado | `data/dialogues_data.js`, `data/shop_data.js` |
| Esferas do Dragão e desejos | Implementado (com bugs) | `data/dragon_balls_data.js`, `data/wish_data.js` |
| Conquistas | Implementado | `data/achievements_data.js` |
| Títulos | **Não existe** | — |
| Filiações/facções | **Não existe** (só alinhamento bem/mal) | — |
| Alinhamento | Implementado | núcleo |
| Torneio de Artes Marciais | Parcial | núcleo + `data/tournaments_data.js` |
| Fusões (Metamoru, Potara, Namekiana) | Implementado | núcleo + `config.js` |
| Grupos, claims, home | Implementado | núcleo (`/dbe:group.*`) |
| Patreon / códigos de resgate | Implementado — **será substituído** | núcleo |
| Eventos dinâmicos | **Não existe** | — |
| Clear lag | Implementado, ligado | núcleo + `config.js` |

## 2. Raças e transformações

Notação: `Lnn` = nível mínimo; número = multiplicador principal de força/destreza/vontade; `ki` = custo `ki_consume`.

| Raça | Bônus base | Transformações (em ordem) |
|---|---|---|
| Earthling | spirit/willpower 1.25 | buffed (L10, 1.3) → full_released (L30, 1.8) → god (divine_ki + L56, 2.6) → ultimate_form → beast → ultra_ego |
| Saiyan | strength 1.5; cauda (defesa 0.9) | oozaru → ssj (L32) → assj → ssj2 (L50) → ssj3 (L60) → lssj (legendary + L32, 3.25) → ultimate_form → golden_oozaru → ssj4 (L76) → ssjg (L84) → ssjb/ssjr (L96) → ssjbe/ssjre (L104) → beast → ultra_ego |
| Namekian | constitution 1.5; regen 1.6 | full_released (L26) → potential_unleashed (L40) → ultimate_form → **orange_form** (L100, 3.7) → beast → ultra_ego |
| Frost Demon | dex/wil 1.25 | second (L10) → third (L20) → fourth (L28) → full_power (L40) → fifth (L64) → ultimate_form → golden (L90) → black_form (L120, 4.0) → beast → ultra_ego |
| Majin | con/dex 1.25; regen 2; absorção | pure (L40, 2.7) → super (L56) → ultimate_form → ultra_majin (L80) → beast → ultra_ego |
| Bio-Android | con/str 1.25; regen 1.7 | semi_perfect (L14) → perfect (L28) → full_power (L40) → super_perfect (L48) → ultimate_form → beast → ultra_ego |
| Demon | strength 1.25; regen 1.5 | horned (L10) → infernal (L25) → archdemon (L45) → demon_lord (L70) → abyssal_king (L100) → true_oni_rage (L100 + `oni_blessing`, **7.6**) — sem transformações globais |

Transformações globais: `ultimate_form` (L60, 3.1, sem dreno de ki), `beast` (L110, 4.0), `ultra_ego` (L120 + hakai).

Observações para o roadmap:

- Namekian **não** tem "Poder Total"; Orange fica **depois** da ultimate_form. Inserir uma forma no meio da lista desloca o índice salvo dos jogadores (ver `KNOWN_ISSUES.md`).
- Bio-Android já tem formas; "Cell Max" não existe.
- Não existem Cerealianos, Tsufurujins, nem habilidades estilo Moro (existe só `absorption`, restrita a Majin).
- `glind` e `android` aparecem no enum de `player.json`, em desejos e em recompensas, mas **não estão definidas** em `races_data.js`.
- Kaioken e Instinto Superior são **skills** (toggles), não transformações.

## 3. Skills

### Ataques de ki (`type: "ki_attack"`)

| id | tipo | dano base | treinadores |
|---|---|---|---|
| `kamehameha` | beam | 6 | cell_npc, master_roshi |
| `galick_gun` | beam | 7 | cell_npc, vegeta_npc |
| `final_flash` | beam | 7 (idêntico ao galick_gun) | cell_npc, vegeta_npc |
| `makankosappo` | beam espiral | 5 | nenhum (recompensa do desafio do Piccolo) |
| `genki_dama` | blast | 15 | king_kai, goku |
| `ki_blast` | blast | 1.5 | vários |
| `kienzan` | disc (corta cauda) | 2 | cell_npc, krillin |

Pipeline: segurar `dbe:techniques` carrega a barra; soltar com ≥50% dispara uma entidade `dbe:ki_attack`. Dano = `dano base × willpower × carga%`. Novos ataques dos tipos existentes podem ser adicionados só por dados.

### Técnicas e passivas (`type: "toggle"` e classes especiais)

`absorption`, `aura_boost`, `burst_move`, `rapid_movement`, `divine_ki`, `friendly_fist`, `fly` (10 tiers), `gigantification`, `hakai`, `healing_power`, `jump`, `kaioken` (6 tiers, até ×10), `ki_fist`, `ki_protect`, `ki_scythe`, `ki_sense`, `legendary`, `limiter`, `majin_mark`, `metamoran_dance`, `potential_unleashed`, `ultra_instinct` (2 tiers, esquiva 8/12).

Não existem: Teletransporte Instantâneo, Mafuba, técnicas de Yardrat, contra-ataque dedicado.

## 4. Treinamento

| Treino | Como funciona hoje | Recompensa |
|---|---|---|
| Sombra | Menu de treino invoca `dbe:shadow_dummy` (até 4 blocos, 1 por dono, cooldown 30 ticks) que copia os atributos do jogador | XP de combate normal |
| Concentração | 5 orbs `dbe:training_orb` surgem à frente; o jogador acerta os corretos (+1), evita os errados (−1) e os de fim; ritmo acelera com a pontuação; progresso na action bar | `floor(pontos/5)` pontos de atributo; 3 tentativas iniciais, 5 após cooldown de 24000 ticks |
| Pesos / Gravity Machine / Sala do Tempo | Aumentam gravidade `g`; reduzem mobilidade e multiplicam XP | XP ×(g×0.5+1); Sala do Tempo ×25 |

XP por dimensão (patch no núcleo): Hell ×8, Namek ×3, Vegeta ×10, Freeza ×10, Yardrat ×9, Sala do Tempo ×25. XP por nível = 100×nível.

## 5. Campanha

Ordem das missões principais (47) — `main_quests_data.js`:

1. Visita ao Lookout
2. Saga Saiyajin (Raditz, Saibamen, Nappa, Vegeta)
3. Saga Freeza (Cui, Dodoria, Zarbon, Força Ginyu, Freeza até Full Power, King Cold, Mecha Freeza)
4. Saga Androides/Cell (Sala do Tempo, A19/A20, A17, A18, Cell e Cell Jrs.)
5. Saga Majin Buu (Pui Pui, Yakon, Dabura, Majin Vegeta, Fat/Super/Kid Buu)
6. Beerus (sobreviver 600 ticks)
7. Ressurreição de Freeza (Shisami, Tagoma, Golden Freeza)
8. Universo 6 (Botamo, Frost, Magetta, Cabba, Hit)
9. Future Trunks (Goku Black, Zamasu, Zamasu Fundido, Zamasu Fundido Corrompido) — **fim atual da campanha**

Secundárias (5): conversão em androide, peixe para o Karin, roupa da Bulma, tesouro do robô pirata, ramen do Whis.
Desafios (3): treino do Piccolo, ondas de Saibamen, "conexões" (falar com 17 NPCs).
Mentor (4): trials do Goku.

## 6. NPCs, inimigos e chefes

- NPCs (24): akira_toriyama, announcer, babidi, beerus, bulma, capsule_corp_engineer, cell_npc, chi_chi, enma_daioh, goku, grand_elder_guru, kami_sama, king_kai, korin, krillin, master_roshi, merchant, mr_popo, piccolo, porunga, shenron, unigame, vegeta_npc, whis.
- Inimigos comuns (43): androides 17–20, Beerus, Botamo, Força Ginyu, Cabba, Cell e Cell Jr., Zamasu (3 versões), Cui, Dabura, Buus, Dodoria, Freeza e soldados, Frost, General Black, Goku Black, Hit, King Cold, Magetta, Majin Vegeta, Nappa, Pui Pui, Raditz, Saibamen, Shisami, Tagoma, Vegeta, Yakon, Zarbon e `test_enemy`.
- Avançados (3): battle_jacket, bear_thief, pirate_robot.
- Aldeões de planeta (5) e animais (6).
- Não existem: Black Freeza como entidade, Broly, Jiren, Moro, Granolah, Gas, Cooler, Androides 13/16/21 (só como roupas).

## 7. Esferas do Dragão e desejos

| Conjunto | Dragão | Dimensão | Regras |
|---|---|---|---|
| Terra | Shenron | overworld (raio 4096) | 7 esferas, 3 desejos, cooldown 24000 ticks |
| Namek | Porunga | `dbe:namek` (raio 1200) | 7 esferas, 3 desejos; troca de raça só aqui |

Desejos: 8 de troca de raça, 11 de item, 2 de skill (`divine_ki`, `potential_unleashed`), crescer cauda.

## 8. Dimensões e planetas

| Planeta | Estado | Acesso | Conteúdo |
|---|---|---|---|
| Terra | Implementado | — | 5 biomas custom (dirtstone, diablo_desert, west_forest…), estruturas (West City, casa do Goku, Lookout…) |
| Namek | Implementado | Namek Space Pod / Star Navigator | Vilas, Esferas de Namek, moradores, evolitium |
| Planeta Vegeta | Implementado | Space Pod / Star Navigator | Vilas Saiyajin hostis, ruínas, loot |
| Planeta Freeza | Implementado | Space Pod / Star Navigator | Postos e vilas hostis |
| Hell | Implementado | Cair abaixo de y-48 no Other World; scriptevent | Portão do Inferno, vilas, golem demoníaco |
| Kai (Kaioshin) | Parcial — com bugs | Esfera no Other World | Terreno completo; integração com o espaço quebrada |
| Space | Implementado | Pods; subir a y≥500 em planetas | Estação orbital, asteroides (sem sistema de oxigênio desde 2026-10-16) |
| Universo 6 | Parcial | Convite do torneio | Só a arena dos Destruidores |
| Yardrat | Implementado | Space Pod / Star Navigator | Vilas pacíficas |
| Planeta do Bills | Não existe | — | — |
| Torneio do Poder | Não existe | — | — |
| Planeta Cereal | Não existe | — | — |

Dimensões registradas pelo núcleo: Other World, Sala do Tempo, Futuro de Trunks, Torneio de Artes Marciais, Angel Staff (pessoal, até 49 jogadores).

## 9. Conteúdo de blocos, itens e recursos (contagem)

| Tipo | Quantidade |
|---|---|
| Entidades (BP) | 104 |
| Entidades cliente (RP) | 101 |
| Itens | 243 (203 `dbe:` + 40 sobrescritas de comidas vanilla) |
| Blocos | 56 |
| Receitas | 74 |
| Loot tables | 57 |
| Spawn rules | 20 |
| Estruturas `.mcstructure` | 48 |
| Biomas / Dimensões | 13 / 8 |
| Attachables (roupas/armaduras) | 149 |
| Sons (eventos / .ogg) | 90 / 117 |
| Chaves de idioma (en_US / es_ES / pt_BR) | 1218 / 1218 / 1241 |

## 10. Comandos

- Admin (cheats/GameDirectors): `/dbe:ban`, `unban`, `data`, `entities`, `learn`, `region`, `removemodifier`, `removeskill`, `reset`, `setattribute`, `setcolor`, `setcustom`, `setmodifier`, `setquest`, `setrace`, `setvalue`, `showform`, `transform`, `worlddata`, `fixstructures`.
- Qualquer jogador: `/dbe:pay`, `/dbe:redeem`, `/dbe:updatestats`, `/dbe:group.*` (create, invite, claim, home…).
- Scriptevents de dimensão: `dbe:kai`, `dbe:kai_return`, `dbe:kai_sky`, `dbe:hell`, `dbe:tournament`, `dbe:tournament_return`, `dbe:tournament_rebuild`, `dbe:space <destino|debug>` e os de Namek.
