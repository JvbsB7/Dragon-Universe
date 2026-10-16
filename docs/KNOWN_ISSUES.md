# Problemas conhecidos

> Levantados na auditoria de 2026-10-14 por leitura de código. **Nenhum foi reproduzido dentro do Minecraft.**
>
> - **Confirmado**: o defeito é evidente no código.
> - **Possível**: depende de comportamento do motor/API ou de cenário específico; precisa de teste.
>
> Problemas no núcleo (`scripts/index.js`) são localizados pelo subsistema: o arquivo era uma única linha ofuscada quando a auditoria foi feita (desde 2026-10-16 é a versão legível equivalente). Problemas em arquivos legíveis trazem `arquivo:linha`.

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

### C10 🟠 Integração Kai ↔ Espaço quebrada — 🔧
- **Onde:** `space_planets.js:577` (`DESTS` sem `KAI_KEY`), `:869-876`, `:1195-1197`; código morto em `:916`, `:1625`; `other_world_kai.js:21` vs `space_planets.js:1317`.
- **Comportamento:** `/scriptevent dbe:space kai` só mostra a ajuda; não existe esfera do Kai no espaço; o retorno em y≥300 sempre dispara antes do lançamento ao espaço em y≥500.
- **Correção aplicada:** Kai entrou em `DESTS`, em `SPHERE_DEFS` (último da lista, ângulo 340°, para não mudar a semente das esferas existentes) e em `RETROFITS` (mundos com o espaço já gerado ganham a esfera). Regra de altitude (decisão 4): em `other_world_kai.js`, y≥300 só devolve ao Other World quem veio de lá (`dbe:kai_origin` com `d = dbe:other_world`); quem veio do espaço ou da Terra sobe até y≥500 e vai para a Estação Orbital.
- **Atenção:** em mundos onde o espaço já foi gerado, a esfera nova pode atravessar um asteroide antigo naquela região.
- **Validação:** `/scriptevent dbe:space kai`; Star Navigator mostra "Planeta Kai"; voar até a esfera no espaço; no Kai vindo do Other World, subir a 300 → Other World; vindo do espaço, subir a 500 → Estação.

### C11 🟠 Origem de retorno corrompida — 🔧
- **Onde:** `space_planets.js:1451-1458`, `namek_dimension.js:607`, `kai_dimension.js:697`, `universe_6_dimension.js:368`.
- **Comportamento:** `dbe:namek_origin` pode gravar uma posição no Kai ou no U6 como "casa"; depois, o destino "Terra" leva ao ponto de spawn.
- **Correção aplicada (pontual, sem refatorar):** `namek_dimension.js` não grava origem quando o jogador sai do Kai ou da arena do U6 (o `space_planets.js` já copiou a casa verdadeira); `kai_dimension.js` trata a arena do U6 como "veio de outro planeta" e `universe_6_dimension.js` faz o mesmo com o Kai. A centralização da constante e das funções de origem fica para a Fase 3.
- **Validação:** Terra → Kai (por comando) → Star Navigator → Namek → "Terra": deve voltar ao ponto de partida na Terra.

### C12 🟡 Ticking areas não removidas em caso de erro — 🔧
- **Onde:** `kai_dimension.js:725-731`, `hell_dimension.js:476-481`, `namek_dimension.js:584-590`, `space_planets.js:1571-1599`.
- **Correção aplicada:** em kai, hell, namek e space, a área é removida no `finally` da viagem (mesmo se o teleporte falhar) e também dentro de `prepareArea` se a geração dos chunks lançar erro. Os ids passaram a ter sufixo aleatório, evitando colisão quando dois jogadores viajam no mesmo tick. O tempo de 100 ticks com a área ativa após a chegada foi mantido.

### C13 ⚪ Limpeza global de golems — intencional
- **Onde:** `planet_villages.js:1044-1052`.
- **Comportamento:** a cada 200 ticks remove todo `dbe:demonic_iron_golem` em 6 dimensões, inclusive os invocados manualmente.
- **Situação:** o comentário do código mostra que é uma migração intencional (golems demoníacos pertencem só ao Hell). Efeito colateral: golems invocados por ovo/comando fora do Hell também somem. Sem correção por enquanto.

### C25 🟡 Robustez dos scripts de dimensão — 🔧
- `universe_6_dimension.js` (`stairPerm`): se `BlockPermutation.resolve` falhar (estado renomeado numa versão do jogo), a escada é colocada na direção padrão em vez de abortar a construção inteira da arena.
- `planet_villages.js` (`siteFor`): não usa `env` antes de `initVillages()`; hoje funcionava só pela ordem dos imports no `index.js`.
- Mapas por jogador (`inKai`, `lastUse`…) **não** foram limpos na saída: os ids são estáveis entre sessões, então o crescimento é limitado ao número de jogadores únicos, e limpar alguns (ex.: oxigênio) mudaria o comportamento ao relogar.

### C14 🔴 Provável bloqueio da campanha em `saga_frieza_1` — 🔧
- **Onde:** `main_quests_data.js:421-422`.
- **Causa:** a tarefa exige o bioma `dbe:namek` na dimensão `minecraft:overworld`; esse bioma só existe na dimensão `dbe:namek`.
- **Correção aplicada:** `dimensionId: "dbe:namek"`. O `check-data` passou a apontar bioma de dimensão própria procurado em outra dimensão.
- **Validação:** jogar até a saga Freeza e entrar em Namek — **precisa ser confirmado no jogo**.

### C15 🟡 Som de carga cortado para todos — 🔧
- **Onde:** `Dragon Universe_bp/animation_controllers/player_dbe.animation_controllers.json` (`stop_aura_sound`).
- **Causa:** `/stopsound @a`.
- **Correção aplicada:** `@s`.
- **Validação:** dois jogadores carregando ki; um para — o som do outro deve continuar.

### C16 🟡 Barra de ki vermelha invisível — 🔧
- **Onde:** `Dragon Universe_rp/ui/hud_screen/stats_bar.json` (`ki_bar_root`).
- **Causa:** só havia painéis blue/green/pink/purple/yellow/white, embora `red` exista em `ki_colors_data.js` e a textura exista.
- **Observação:** o núcleo envia `auraProperties.kiBarColor` direto para a HUD (padrão `blue`); hoje nenhuma forma usa `red`, então o defeito não aparecia.
- **Correção aplicada:** painel `red_ki_bar` adicionado. O `check-data` valida `kiBarColor` contra os painéis da HUD.

### C17 🟡 Arquivos e textos
- 🔧 `Dragon Universe_bp/blocks/decor/red_tile_slab.txt`: definição salva como `.txt`, nunca carregou. Renomeada para `red_tile_slab.json` e incluída no `contents.json`, em `blocks.json` (som) e nos três `.lang` (decisão da equipe: ativar). O componente `dbe:slab` é registrado pelo núcleo. **Pendente:** não há receita (a laje só aparece no inventário criativo); `map_color` é azul (`#4e50cf`); testar laje dupla (`dbe:double_bit`) e o drop ao quebrar.
- 🔧 `Dragon Universe_bp/contents.json`: listava `worldgen/structure_sets/city.txt` (inexistente) no lugar de `city.json`.
- 🔧 `dbe:medical_moss` era item e bloco ao mesmo tempo, sem `replace_block_item`. O item colhido ganhou `minecraft:block_placer` com `replace_block_item: true` (padrão dos outros pares item/bloco); o id `dbe:medical_moss` foi mantido, então plantações já existentes nos mundos continuam válidas. Efeito colateral: o musgo colhido também pode ser plantado, como a batata vanilla.
- Texturas ausentes: `textures/ui/buttons/help_button(_hover)` (`ui/menus/menu_form.json`) — **precisa de arte**; `textures/ui/images/patreon_items` e `patreon_chat` (`ui/menus/news_form.json`) — ficam para a substituição do sistema Patreon (Fase 3).
- 🔧 `Dragon Universe_rp/texts/en_US.lang:588`: chave com `saga.` duplicado.
- 🔧 Chaves só em pt_BR (saga Future Trunks e convite de mentor): traduzidas para en_US e es_ES — **revisão de texto recomendada**. Os três diálogos da Bulma em `saga_future_trunks_3` (objetivo 1) estão como `""` nas três línguas: **texto a escrever**.
- 🔧 Geometrias `kale_hair` e `trunks_hair` definidas duas vezes: removidas as cópias de `legacy_hairs/` (nenhuma entidade usa essas duas geometrias).
- 🔧 `items/music_disc_hero.json` com `format_version: "beta"` → `1.26.4`.

### C18 🟡 Dados inconsistentes / conteúdo inacessível
- Raças `glind` e `android` referenciadas mas ausentes em `races_data.js`. 🔧 Desativado o que quebrava: desejo `change_race` "glind" da Porunga e a recompensa de raça da `android_conversion` (a missão segue dando zeni). Remoção temporária aprovada pela equipe até a Fase 5. Confirmado no núcleo: `setRace` com raça desconhecida lança `InvalidRaceError` dentro da entrega de recompensas, então a recompensa antiga nunca funcionou. O evento `dbe:become_android` de `player.json` não é disparado pelo núcleo; um jogador que receber `dbe:race = android` por `/event` fica sem raça válida e o wrapper lança erro. **Pendente (Fase 5):** Zamasu, Zamasu Fusionado e Zamasu Fusionado Corrompido continuam com `race: "glind"` e `gigantification` exclui `glind`.
- ❎ `ki_protect` (Kami-sama) e `metamoran_dance` (Goku): **são acessíveis**. O núcleo registra diálogos próprios desses NPCs com submenu de skills (`kami_sama_skills`; `goku_skills`, que exige ser discípulo do Goku). Registrado em `tools/lib/allowlist.mjs`.
- 🔧 `makankosappo` tinha preço, mas nenhum treinador (só vinha do desafio `piccolo_trial`). Piccolo (`dbe:piccolo`, que já tem submenu de skills) passou a ensiná-la por 6 pontos; o desafio continua dando a técnica de graça. Sem `chargeSpeed`, o núcleo usa o padrão 1 (carga mais lenta que os outros beams, 1.5) — não é defeito.
- ❎ `kiBarColor: "white"`: não é cor de `ki_colors_data.js`; o valor vai direto para a HUD, que tem o painel `white`.
- 🔧 Sagas Future Trunks usavam `entityDefinitions.attributes` (o núcleo só lê `powerDefinition`; os chefes nasciam sem atributos e sem nível recomendado). Convertido para `powerDefinition.level` preservando o total de pontos pretendido — o núcleo distribui `(ATTRIBUTE_POINTS_PER_LEVEL + SKILL_POINTS_PER_LEVEL) × nível × 1,1` pontos: Goku Black 102 e 125, Zamasu 136, Zamasu Fusionado 159, Corrompido 170. **Validar o balanceamento no jogo.**
- `absorption` e `gigantification` restringem raças por lista de exclusão — raças novas ganham acesso automaticamente.

- 🔧 `config.js` (`INDESTRUCTIBLE_BLOCKS`): `minecraft:light_block` não existe mais (desde a 1.21 os blocos de luz são `minecraft:light_block_0` … `_15`), então os blocos de luz não estavam protegidos. Trocado pelas 16 variantes; o núcleo compara por `typeId` exato (`includes`).

### C24 🟡 Achados da validação automática (2026-10-15)
- 🔧 `final_flash` usava os sons `skill.final_flash_launch` e `skill.final_flash_gun`, que não existiam: a skill não tinha som. Eventos criados em `sound_definitions.json` reaproveitando os arquivos do Galick Gun (trocar quando houver áudio próprio).
- 🔧 `saga_universe_6_1`: os dados têm 5 objetivos, mas os `.lang` usavam a numeração anterior (sem o objetivo `enter_biome`); os diálogos do Goku e o de conclusão apareciam como chave crua. Chaves renumeradas nas três línguas.
- Chaves `quest.battle_jacket_return.*` nas três línguas sem missão correspondente nos dados (missão removida ou não implementada).
- `entities_data.js` `dbe:frieza`: forma `mecha_frieza` sem multiplicadores e fora das formas de `frost_demon`.
- `Dragon Universe_rp/.png`: PNG 16×16 com nome vazio na raiz do RP (listado no `contents.json`).
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

### C26 Resultados do primeiro teste no jogo (2026-10-15)

Verificado pela equipe no Bedrock 26.52 (✅):
- C14 — `saga_frieza_1` conclui ao chegar em Namek.
- Sagas Future Trunks com `powerDefinition`: chefes com nível e força coerentes.
- Textos da saga Future Trunks em inglês.
- Musgo medicinal: planta com sementes e com o item colhido.
- Blocos de luz não são destruídos por ataque de ki.
- Piccolo ensina `makankosappo`.

Corrigido após o teste (🔧, aguardando novo teste):
- Laje vermelha dupla dropava 1 laje: o estado `dbe:double_bit` usa `loot_tables/blocks/red_tile_slab_double.json` (2 lajes). Receitas novas: 3 azulejos vermelhos → 6 lajes; cortador de pedra: 1 azulejo → 2 lajes.
- Textos de Namek: o requisito `in_biome` passou a "Esteja em %s" / "Be in %s" / "Estar en %s" (o es_ES estava em português); o bioma `dbe:namek` passou a "Planeta Namek"; o objetivo `enter_biome` passou a "Vá até %s (%s), nas coordenadas %s"; adicionados os nomes das 12 dimensões customizadas (`dimension.dbe:*`), que apareciam como chave crua.
- Saibaman e veado deixaram de nascer em Namek (entrada `namek` removida de `spawn_rules/saibaman.json` e `spawn_rules/deer.json`), a pedido da equipe.

Em investigação:
- 🔧 `dbe:music_disc_hero` (disco "Flow - Hero") ficava invisível após corrigir o `format_version`. **Removido a pedido da equipe:** item, textura, entrada no `item_texture.json`, evento `record.hero` e `sounds/music/game/records/hero.ogg`, catálogo, `contents.json` e textos.
- 🔧 "Missing icon for data-driven item 'dbe:space_helmet'": **capacete e sistema de oxigênio do espaço removidos a pedido da equipe** — item, receita, attachable, modelo, texturas, textos, entradas no `contents.json`/`item_texture.json` e as entradas dos baús `vegeta_ruins` e `frieza_outpost` (o peso do capacete foi somado ao "vazio", mantendo as chances dos outros itens). Em `space_planets.js` saíram `handleOxygen`, `hasHelmet`, `inPressurisedZone` e a flag `airless`; respirar no espaço é livre. Jogadores que já tinham o capacete ficam com um item desconhecido no inventário.
- Nome cru `tile.dbe:red_tile_slab.name`: atlas e chave de idioma estão corretos na branch; provável cópia antiga/duplicada do Resource Pack no jogo — retestar após recopiar os packs.
- `saga_frieza_10` ("Soldados do Imperador"): ir às coordenadas do Dirtstone não conclui. O núcleo calcula as coordenadas com `calculateClosestBiomeFromSeed` a partir de y=0 e conclui comparando o bioma exato na posição do jogador; o Dirtstone substitui planícies por ruído (`replace_biomes`), então o ponto calculado pode não ser Dirtstone na superfície. Aguardando teste com `/locate biome dbe:dirtstone`. As sagas Saiyajin também usam `enter_biome` de Dirtstone e podem ter o mesmo problema.

### C27 🟡 Estruturas repetidas no Mundo Superior e animação de voo — 🔧

- **Comportamento:** Casa do Kame, Casa do Goku, Arena do Cell, West City, Nave do Babidi e as cidades eram geradas por `worldgen/structure_sets` (espaçamento de ~30 chunks), repetindo-se pelo mundo. O Bedrock não tem limite de quantidade por mundo para structure sets.
- **Correção aplicada:** os 6 structure sets foram removidos (as estruturas e template pools continuam). O novo `scripts/world_structures.js` (importado na parte legível do topo do `index.js`) planeja os pontos perto do spawn pela semente (`calculateClosestBiomeFromSeed`) e coloca cada estrutura com `placeJigsawStructure` quando um jogador chega a 96 blocos: 1 Casa do Kame (oceano não frio), 1 Casa do Goku (Dirtstone), 1 Arena do Cell (Dirtstone Plains), 1 Nave do Babidi (deserto), 3 West City e 5 cidades, com no mínimo 400 blocos entre elas. O plano fica salvo no mundo (`dbe:world_structures`); `/scriptevent dbe:structures` lista os pontos. Testado com um mundo simulado em Node (12 pontos planejados, 12 colocadas, nenhuma duplicada) — **falta testar no jogo**.
- **Limitações:** mundos antigos mantêm as cópias já geradas; se o bioma não for encontrado, o ponto de busca é usado (marcado como "biome not found" no comando).
- **Animação de voo (RP):** `animation.player.fly.walking` passou a inclinar o corpo e as pernas conforme a velocidade horizontal (`q.ground_speed`) e a flutuar levemente quando parado; transições do controlador de voo de 0.2 → 0.35 s. A mecânica do voo (peso e tremor) continua no núcleo e não foi alterada.

### C28 ⚪ Nome da addon — 🔧

- `pack.name` (BP e RP, três idiomas) passou de "Dragon Block" para "Dragon Universe"; grupo de itens do inventário, notícias, textos de apoio e mensagens de servidor trocaram "DBE"/"Dragon Evolution" por "Dragon Universe". `pack.credits` passou a "Dragon Universe v1.6.17 - baseado no Dragon Evolution de About04" (crédito ao autor original mantido).
- **Não alterado de propósito:** namespace `dbe:`, chaves de salvamento `dragon_evolution`, nomes das pastas dos packs e uma mensagem de depuração dentro do núcleo ofuscado ("entidades do DBE").
- 2026-10-16: pastas renomeadas para `Dragon Universe_bp` e `Dragon Universe_rp`; nome "Dragon Universe" escrito direto nos dois `manifest.json` (antes vinha de `pack.name`) e autores atualizados (equipe + About04). Os UUIDs não mudaram, então os mundos continuam reconhecendo os packs.
- 🔧 **Logo da tela de carregamento:** o antigo `textures/ui/title.png` ("MINECRAFT DRAGON EVOLUTION", laranja) foi substituído por "MINECRAFT DRAGON UNIVERSE" em azul, gerado por `tools/logo/make-logo.mjs` a partir do original (mantém o "MINECRAFT" e redesenha a linha de baixo no mesmo estilo). Provisório: a equipe pode trocar por uma arte própria (PNG RGBA 2005×514).
- **Pendente:** o conteúdo de `pack.news`, `donate.*` e `server.message.*` ainda é o texto do autor original (notícias da versão beta, valores e canais de apoio do Patreon dele); deve ser reescrito com as informações da equipe junto com a troca do sistema Patreon.

### C29 🟠 Erros do Content Log no Bedrock 26.52 (teste de 2026-10-16) — 🔧

- **Blocos dos planetas não carregavam:** `blocks/planets/{vegeta,frieza,yardrat}_{soil,rock}.json` usavam `menu_category.group: "itemGroup.name.stone"`, sem namespace, e o 26.52 recusa a definição inteira. Em cadeia, os biomas `dbe:vegeta`, `dbe:frieza` e `dbe:yardrat` não carregavam e os planetas usavam blocos vanilla de reserva. Corrigido para `minecraft:itemGroup.name.stone`; o `validate-json` agora acusa grupo sem namespace.
- **Receita duplicada:** `dbe:headband` (3 lãs vermelhas em linha) tinha os mesmos ingredientes da `minecraft:red_wool_slab`. Nova receita: lã vermelha + linha + lã vermelha; o `unlock` usava `minecraft:wool` (id antigo) e passou a `minecraft:red_wool`.
- **`dbe:capsule_991` sem dados:** o núcleo avisava "Não foram encontradas informações para as seguintes entidades do DBE". Entrada mínima adicionada em `entities_data.js`, como os outros veículos.
- **Avisos esperados (sem ação):** "Dimension definition ... registered via scripting was replaced by the definition from pack" — os scripts registram as dimensões como reserva e o jogo usa os JSON de `dimensions/`. "format_version: this member was found in the input, but is not present in the Schema" (aviso único, origem não identificada; as dimensões carregam normalmente).

### C30 Retorno da rodada de testes de 2026-10-16

- **Versão antiga nos testes:** parte da equipe testou uma cópia antiga (mensagem "Sem ar! Use um Capacete", planetas com blocos vanilla, comandos novos inexistentes). Causa provável: a versão dos packs continuava `1.6.17`, e o Minecraft mantém o pack já instalado com o mesmo UUID e versão. Versão subida para **1.7.0** e pacote único gerado por `node tools/package-addon.mjs` (`dist/Dragon-Universe-1.7.0.mcaddon`, fora do Git).
- 🔧 **Mobs do Minecraft nos planetas:** os biomas `namek`, `vegeta`, `frieza`, `yardrat` e `space` tinham as tags `overworld`, `monster` e/ou `animal`, que liberam os spawns vanilla (zumbi, esqueleto, aranha, vacas...). Ficaram só com a tag do próprio planeta; as regras de spawn do addon usam essas tags e continuam valendo.
- 🔧 **Genki Dama sem som:** a técnica não tinha `startChargeSound`/`shootSound`. Eventos novos `skill.genki_dama` (carga, reaproveita `sounds/skill/absorbing`) e `skill.genki_dama_launch` (disparo, reaproveita o do Kamehameha) — provisórios até existir um som próprio.
- 🔧 **Soldados do Freeza com muita vida:** os soldados das missões da saga Freeza nascem com `powerDefinition` de nível 18, 24, 30 e 40. O núcleo distribui `(7 + 1) × nível × 1,1` pontos (8 por nível, contando os de skill, mais 10%), então um soldado de nível 18 tem ~33 de constituição (≈660 de vida) contra ~25 (≈500) de um jogador de mesmo nível que distribuiu os pontos por igual — e as missões pedem 2 a 4 de uma vez. Aplicado na 1.7.1 (aprovado pela equipe): soldados das missões com cerca de 2/3 do nível (18→12, 24→16, 30→20, 40→28), chefes sem mudança. Soldados que nascem naturalmente (sem `powerDefinition`) ficam com atributos 1 (20 de vida), ao contrário dos das missões.
- **Pedidos de design (próximas etapas):** carregar ki e parar o voo com toque duplo (agachar/pular) e ajuste da velocidade na água (núcleo, junto com a correção do voo); guarda hoje é segurar o item do menu (original), precisa de decisão sobre outro controle; formas Majin (pure, super, ultra) só mudam a cor da aura — faltam texturas; treino de concentração com interface nova (quadrado ou painel fixo).
- `/tickingarea list` respondendo "não existem áreas" é o resultado esperado (ticking areas removidas corretamente).

## 2. Possíveis riscos (precisam de teste)

| # | Risco | Onde |
|---|---|---|
| P1 | Execução restrita: wrapper criado dentro de `beforeEvents.entityHurt`; comandos que alteram o mundo sem `system.run`; handler async em `beforeEvents.playerInteractWithEntity` | núcleo |
| P2 | Sem handler de saída de jogador: alterações dos últimos 20 ticks podem se perder; reconexão rápida pode reutilizar instância inválida | núcleo |
| P3 | `getBlock` em chunk descarregado pode lançar `LocationInUnloadedChunkError`, gerando spam nos scanners | scripts de dimensão |
| P4 | Crescimento ilimitado: uma dynamic property por chunk gerado e por vila; caches nunca limpos (mapas por jogador: ver C25) | núcleo, `planet_villages.js`, scripts de dimensão |
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
