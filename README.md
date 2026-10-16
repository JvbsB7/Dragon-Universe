# 🐉 Dragon Universe

**Dragon Universe** é um projeto de reformulação e expansão de uma addon de Dragon Ball para Minecraft Bedrock, baseada no **Dragon Evolution** de About04 (ver [créditos](docs/CREDITS.md)). O objetivo é transformar a base herdada em um projeto organizado, estável e expansível, com novas mecânicas, transformações, habilidades e sistemas de progressão inspirados no anime e no mangá.

## 🎯 Objetivos
- Adicionar transformações e habilidades inspiradas no universo e no mangá de Dragon Ball.
- Aprimorar as mecânicas de combate e progressão dos personagens.
- Expandir as possibilidades de gameplay e exploração.
- Buscar maior fidelidade às referências da obra original.
- Manter uma base técnica confiável, documentada e otimizada.

## 🚧 Status

Em desenvolvimento — **Fase 1 (auditoria e documentação) e Fase 2a (validação automática) concluídas**; Fase 2b (correções) em andamento: as correções em arquivos legíveis aguardam teste no jogo. Veja o [roadmap](docs/ROADMAP.md).

| Área | Estado |
|---|---|
| Raças (7), transformações, skills (29), combate, voo | Implementado (herdado) |
| Treinos de sombra e concentração, pesos, Gravity Machine | Implementado (herdado) |
| Campanha até a saga Future Trunks (47 missões) | Implementado (herdado) — possível bloqueio na saga Freeza |
| Planetas: Terra, Namek, Vegeta, Freeza, Hell, Space, Yardrat | Implementado |
| Kai e Universo 6 | Parcial |
| Planeta do Bills, Torneio do Poder, Planeta Cereal | Não iniciado |
| Títulos, filiações, eventos dinâmicos, treino físico e mental | Não iniciado |

Problemas conhecidos: [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

## 📦 Requisitos

- **Minecraft Bedrock 26.52** (versão-alvo da equipe). `min_engine_version` atual dos manifests: `1.26.40`.
- Experimento **Beta APIs** ativado no mundo — o script usa `@minecraft/server` e `@minecraft/server-ui` na versão `beta`. APIs beta podem mudar a cada atualização do jogo; teste sempre na versão-alvo.
- Os dois packs ativados juntos (o Behavior Pack depende do Resource Pack e vice-versa).

> Não há dependências de Node/npm no projeto. Nenhum processo de build é necessário: os arquivos são usados como estão. O Node.js só é usado pelas [ferramentas de validação](#-validação-automática-tools).

## ▶️ Como instalar e testar

1. Copie `Dragon Universe_bp` para a pasta `development_behavior_packs` e `Dragon Universe_rp` para `development_resource_packs`, dentro da pasta `com.mojang` do Minecraft Bedrock.
   As pastas `development_*` recarregam os arquivos sem precisar reimportar o pacote.
2. Crie um mundo de teste, ative o **Behavior Pack** (o Resource Pack é ativado junto) e o experimento **Beta APIs**.
3. Ative os cheats se quiser usar os comandos administrativos (`/dbe:*`).
4. Após alterar scripts, use `/reload` no mundo; após alterar JSON de entidades/itens/blocos ou o Resource Pack, saia e entre novamente no mundo.
5. Erros de script e de conteúdo aparecem no **Content Log** (Configurações → Criador → ativar Content Log GUI).

Para validar mudanças, siga o checklist de regressão em [docs/ROADMAP.md](docs/ROADMAP.md#checklist-de-regressão-manual-no-jogo).

## 🧪 Validação automática (`tools/`)

Scripts Node que verificam os packs **sem alterar nenhum arquivo**. Requisito: **Node.js 22** ou mais recente. Não usam pacotes npm — não há nada para instalar.

Na raiz do repositório:

```bash
node tools/validate.mjs
```

Executa todas as verificações, imprime os problemas agrupados por categoria e um resumo. O código de saída é `0` sem erros e `1` se houver algum erro — use antes de cada commit/PR.

| Opção | Efeito |
|---|---|
| `--strict` | Avisos também fazem a validação falhar |
| `--errors-only` | Lista só os erros (os avisos continuam contados no resumo) |

Cada verificação também pode ser executada separadamente (aceitam as mesmas opções):

| Script | O que verifica |
|---|---|
| `tools/validate-json.mjs` | Parse de todos os `.json`/`.material` dos dois packs (aceita comentários `//` e `/* */`); definições salvas com extensão errada (ex.: `.txt`); arquivos inesperados; `format_version` fora do padrão; divergências entre os `contents.json` e os arquivos; dependências entre os manifests |
| `tools/check-refs.mjs` | Entidades BP↔RP; geometrias, texturas, animações, render controllers e sons usados por entidades e attachables; caminhos `textures/...` da UI, partículas e dados; ícones em `item_texture.json`; texturas de blocos em `terrain_texture.json`/`blocks.json`; arquivos e eventos de `sound_definitions.json`; loot tables, recipes, spawn rules e feature rules; ids `dbe:` usados em `scripts/data/*.js` sem definição JSON; ids duplicados; item e bloco com o mesmo id sem `block_placer.replace_block_item` |
| `tools/check-data.mjs` | Importa `scripts/data/*.js` e confere: raças, skills, transformações, missões, regiões, diálogos e modificadores referenciados existem; cores de ki existem em `ki_colors_data`; skills com treinador acessível (NPC com submenu de skills) ou obtidas por recompensa; `entityDefinitions` das missões; chaves de idioma de missões, conquistas e diálogos presentes em `en_US`, `es_ES` e `pt_BR`; chaves órfãs, repetidas ou presentes só em parte das línguas |
| `tools/check-syntax.mjs` | `node --check` em todos os `.js` de `scripts/` (inclusive o núcleo, sem modificá-lo). Aceita caminhos como argumento para checar arquivos específicos |
| `tools/compare-scripts.mjs [revisão]` | Carrega os scripts da revisão do Git (padrão `HEAD`) e os da pasta atual com um `@minecraft/server` falso, executa os callbacks registrados e compara todas as chamadas feitas ao jogo. Use em mudanças que não devem alterar a lógica. Não substitui o teste no jogo |
| `tools/deobfuscate-core.mjs <entrada> <saída>` | Conversão (já aplicada) do núcleo ofuscado para a versão legível. Precisa do Prettier: `cd tools && npm install` |

**Erros** são problemas que quebram algo no jogo ou deixam conteúdo inacessível; **avisos** são suspeitas que precisam de análise. Enquanto houver itens pendentes em [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) (texturas da UI em C17, raça glind em C18), a validação termina com código `1` — é esperado. Ao corrigir um problema, a contagem de erros deve cair; um erro novo indica regressão.

Observações:

- Recursos do jogo base (texturas, animações, sons vanilla) e as dimensões registradas pelo núcleo sem JSON próprio ficam em `tools/lib/allowlist.mjs`. Acrescente lá somente itens confirmados, nunca para silenciar um erro real.
- `scripts/data/*.js` são copiados para uma pasta temporária e importados de lá (os imports sem extensão, como `"./variables"`, não funcionam direto no Node); os originais não são tocados.
- Não use `node --check arquivo.js` direto nos scripts: sem `"type": "module"`, o Node 22 deixa passar erros de sintaxe em arquivos com `import`/`export`. O `check-syntax.mjs` já contorna isso.

## 🗂️ Estrutura do repositório

```
Dragon Universe/
├─ README.md                  ← este arquivo
├─ docs/                      ← documentação técnica
│  ├─ ARCHITECTURE.md         ← como os sistemas funcionam e se comunicam
│  ├─ SYSTEMS.md              ← inventário de raças, skills, missões, NPCs, planetas
│  ├─ KNOWN_ISSUES.md         ← bugs confirmados e riscos
│  ├─ ROADMAP.md              ← fases, prioridades e checklist de testes
│  └─ CREDITS.md              ← autor original e equipe
├─ tools/                     ← validação automática (Node, sem dependências)
├─ Dragon Universe_bp/           ← Behavior Pack (lógica)
└─ Dragon Universe_rp/           ← Resource Pack (visual, som, UI, textos)
```

### Behavior Pack (`Dragon Universe_bp/`)

| Pasta | Responsabilidade |
|---|---|
| `scripts/index.js` | **Núcleo** (legível desde a Fase 3; nomes de variáveis ainda curtos): combate, atributos, raças, transformações, skills, voo, treinos, missões, NPCs, lojas, Esferas, comandos, HUD e salvamento. Não editar diretamente (ver [arquitetura](docs/ARCHITECTURE.md#2-o-núcleo-ofuscado-scriptsindexjs)) |
| `scripts/data/` | Dados legíveis consumidos pelo núcleo: raças, transformações, skills, missões, diálogos, lojas, desejos, Esferas, regiões, chefes. **Principal ponto de extensão** |
| `scripts/config/config.js` | Parâmetros gerais: limites de atributo, XP, recompensas, clear lag, stamina, cooldowns |
| `scripts/*_dimension.js`, `space_planets.js`, `planet_villages.js`, `hell_terrain.js`, `other_world_kai.js` | Geração por script dos planetas e viagem entre dimensões |
| `entities/` | Comportamento das entidades; `player.json` define as propriedades sincronizadas (raça, forma, voo, aura…) |
| `items/`, `blocks/`, `recipes/`, `loot_tables/`, `spawn_rules/`, `trading/` | Conteúdo de itens, blocos e drops |
| `dimensions/`, `biomes/`, `features/`, `feature_rules/`, `worldgen/`, `structures/` | Dimensões (todas vazias, terreno por script), biomas e estruturas |
| `animation_controllers/` | Escalada da Torre de Korin e parada do som da aura |

### Resource Pack (`Dragon Universe_rp/`)

| Pasta | Responsabilidade |
|---|---|
| `entity/`, `models/`, `animations/`, `animation_controllers/`, `render_controllers/` | Visual das entidades e do jogador (raças, cabelos, auras, formas) |
| `attachables/` | Roupas e armaduras |
| `particles/`, `sounds/`, `sounds.json` | Efeitos de ki, aura, Kaioken, sons |
| `ui/` | HUD customizado (barras de vida/ki/stamina, técnicas, zeni) e menus |
| `texts/` | Traduções `en_US`, `es_ES`, `pt_BR` — manter as três sincronizadas |

## 🛠️ Onde modificar

| Quero alterar… | Arquivo |
|---|---|
| Atributos e transformações de uma raça | `Dragon Universe_bp/scripts/data/races_data.js` |
| Transformações globais (Ultimate, Beast, Ultra Ego) | `scripts/data/global_transformations_data.js` |
| Ataques de ki e técnicas | `scripts/data/skills_data.js` |
| Chefes e inimigos (nível, skills, formas) | `scripts/data/entities_data.js` |
| Missões | `scripts/data/main_quests_data.js`, `side_quests_data.js`, `challenge_quests_data.js` |
| Diálogos de NPC e o que cada um ensina/vende | `scripts/data/dialogues_data.js`, `shop_data.js`, `masters_data.js` |
| Desejos e Esferas | `scripts/data/wish_data.js`, `dragon_balls_data.js` |
| Textos exibidos | `Dragon Universe_rp/texts/*.lang` |
| Regras de dano, voo, controles, fórmulas | `Dragon Universe_bp/scripts/index.js` — validar com `node tools/compare-scripts.mjs` |

Detalhes, limites e cuidados (ex.: transformações novas devem ser acrescentadas **no fim** da lista da raça): [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#5-onde-adicionar-ou-modificar-conteúdo).

## ⚠️ Cuidados importantes

- **Não renomeie** o namespace `dbe:`, os ids existentes nem as chaves de salvamento — mundos existentes perderiam progresso.
- **Não reordene** transformações nem tarefas de missão já publicadas: o progresso salvo usa a posição na lista.
- **Não mova arquivos** dos packs sem atualizar referências, `contents.json` e manifests.
- O nome exibido no jogo é "Dragon Universe" (nome direto nos dois `manifest.json` e `pack.name` nos `.lang`); as pastas são `Dragon Universe_bp` e `Dragon Universe_rp`. Os ids internos continuam `dbe:` e as chaves de salvamento `dragon_evolution` — não renomear sem migração. Os UUIDs dos packs não mudaram, então mundos existentes continuam reconhecendo os packs.

## 👥 Créditos

- Projeto original: **Dragon Evolution**, por **About04** — ver [docs/CREDITS.md](docs/CREDITS.md).
- Dragon Universe: equipe **[preencher]**.
- Dragon Ball é marca registrada de seus criadores; este é um projeto de fãs, sem ligação oficial.
