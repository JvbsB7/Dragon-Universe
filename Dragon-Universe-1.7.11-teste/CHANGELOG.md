# Dragon Universe 1.7.11 — dimensões e viagens
27 de outubro de 2026. Correção da candidata 1.7.10; fonte aceita condicionalmente para build, com autorização dos instaláveis registrada na auditoria externa posterior. Minecraft 26.52 / Appx 1.26.5203.0 com APIs Beta e Próximo Recurso de Criador; teste nativo pendente.
- Restaurado somente format_version 1.26.50 na raiz dos oito documentos BP de dimensão. A afirmação histórica abaixo de que esse metadado era rejeitado não foi comprovada: o warning anterior não justificava sua remoção. Os objetos de dimensão/IDs/biomas/alturas/geradores permanecem iguais.
- Leitura de origem protegida por try/finally, reservas liberadas em falhas, preparação de arena recuperável após Promise rejeitada e menu aguardando a viagem observada.
- Diagnósticos preservam ID físico, estágio e cadeia causal. Comando recusado antes de lookup é dispatch/preparação. Retorno preserva a última causa e interrompe candidatos após movimento sem confirmação; não inventa rollback/chegada.
- Três novas mensagens por idioma (pt_BR/en_US/es_ES): destino indisponível, falha ao iniciar/preparar e falha ao concluir/confirmar. Todas as linhas antigas, inclusive Future/staff/nomes, preservadas byte a byte. Sem atribuição genérica à versão ou promessa de origem imutável.
- Content confirmou as oito rotas/aliases/story/retornos. Kaioshin permanece fisicamente dbe:kai para preservar saves; Arena dbe:universe_6_arena e Hell dbe:hell. Hell não pertence ao Navigator. Other World, King Kai e Kaioken preservados.
- Manifests/módulos/crossdeps 1.7.11, mínimo declarado 1.26.50 e mesmos cinco UUIDs. Corrigido o validador que ignorava dimensões sem format_version; contrato local de metadados não equivale ao schema completo do engine.
- Delta contra o mcaddon 1.7.10 real: 19 arquivos de produção alterados, zero adicionados/removidos e 2693 idênticos. Sem saves, construções ou arquivos antigos alterados; nenhum registro fictício, destino removido ou redirecionamento.
- QA atual: 276/284 casos distintos; cinco wrappers EPERM e três contratos históricos mantidos como falhas. Novo QA11/11 e origem7/7. Validador geral41erros/42avisos, não aprovado; gate421 não reexecutado. Artefatos reais exigem auditoria independente e o teste nativo continua pendente.
- Evidências e limites completos: docs/README_1.7.11.md, docs/DELTA_1.7.11.json e docs/TESTES_1.7.11.md. Não considerar os gates históricos conflitantes ou EPERM como passes.

# Dragon Universe 1.7.10 — candidato para teste controlado

27 de outubro de 2026. Continuação da 1.7.9 preservada, com QA de fonte condicional e auditoria dos instaláveis registrada separadamente. Detalhes e inventário completo: `docs/README_1.7.10.md`, `docs/RELEASE_1.7.10.md` e `docs/DELTA_1.7.10.json`.

- Interação NPC em contexto gravável, revalidada; custo da missão do Kame consumido e persistido antes de um bastão/15 Zeni.
- Intenção de custo durável antes do inventário; falhas de save/rollback incerto não permitem cobrar outra roupa após reconexão. Revisão OP de custo apenas rearma a tarefa ativa com insumo restaurado.
- Retomada da missão ativa com objetivos realmente carregados/concluídos; histórico ambíguo continua sem concessão automática.
- Buffers de contenção planetária com proveniência, quatro vizinhos e checkpoint de perfil antes de conclusão. Fallback sem bulk exige faixas de ar comprovadas e preserva blocos importados/fases desconhecidas.
- Chegada/resgate recusam buffers incompletos; reparo explícito preview/apply permite apenas substituição de líquido revisada em spans sólidos, com exclusões/snapshots/prova exata.
- Oito objetos de dimensão preservados, metadado rejeitado omitido e registros startup duplicados removidos. UUIDs, IDs físicos, APIs e mínimo declarado preservados.
- Quatro referências fantasmas de textura removidas; variantes reais, imagens, caudas, dados e idiomas preservados. Sem som fictício para `normal/fly`.
- Dezoito caminhos de pack alterados frente ao mcaddon 1.7.9; sem adições/remoções de arquivos de pack. Nenhum Minecraft/save real testado nesta entrega.
- QA integrado 26/26, sintaxe e grafo 33/33; roteiro de inventário cheio corrigido. Gate amplo: 400/421, com 15 falhas ambientais e seis expectativas históricas contextualizadas. Cinco payloads Future verificados separadamente não tornam seus wrappers aprovados. Validador geral não aprovado: 34 impedimentos ambientais e sete diagnósticos históricos.

# Dragon Universe 1.7.9 — geração, viagens, entidades e recompensa

26 de outubro de 2026. Entrega integrada para teste controlado, sem aceite nativo ou reparo de save executado.

- Future passa de prazos totais para inatividade medida: espera individual 1200 ticks, job 2400, fila da cidade 600 sem avanço real da dependência. Progresso verificado permite continuar além desses tempos totais; polling não renova prazo.
- Promise única observada desde a criação mantém erros originais, elimina o wrapper órfão reproduzido no QA e compartilha preparação entre jogadores/retries. Observador por job e waiters removíveis evitam retenção por polling.
- Geração limitada por unidades de trabalho, diagnóstico de fase/última área/operação em curso e checkpoints por chunk. Retoma 188 áreas concluídas + 22 incompletas sem reconstruir as prontas. Nenhuma flag substitui prova dos blocos.
- Onze chaves traduzidas nos três idiomas distinguem fases, espera encerrada, falha de preparação, viagem já ativa e falha de chegada. Logs mantêm detalhes técnicos; chat usa frequência limitada.
- Vegeta, Freeza e Yardrat adquirem chunks antes de operar, incluindo halo de decoração. Escritas/prova exata antes dos marcadores; conteúdo real de todo volume protege blocos estrangeiros mesmo sem evento de jogador. Decoração parcial ambígua exige revisão, sem regeneração destrutiva.
- Entidades e alvos revalidados após awaits; callbacks observados e limpos sem dono. Dragon Balls adiam scan descarregado e relêem o bloco antes de efeitos. Dispatch hover limitado aos 50 pares reais de eventos, preservando villagers de hover permanente.
- “O Velho Tarado” usa recibo persistido do Bastão Mágico: inventário cheio fica pendente; token permite reconciliar inserção comprovada sem repetir Zeni. Recuperação antiga apenas por operador e jogador revisado, nunca concessão global.
- **335 testes aprovados**, 33 scripts/grafo válidos, mesmos 11 erros conhecidos no validador geral. Dez arquivos de pack alterados; Other World, definições, quest e IDs salvos preservados. Guia em `TESTES.md`, causas/limites em `RELATORIO.md`. Crash de inventário/banco não é atômico; Minecraft pendente.

# Dragon Universe 1.7.8 — geração, Kaioshin e retorno à Terra

25 de outubro de 2026. Candidato para teste em cópia; os sintomas nativos da 1.7.7 não são declarados encerrados.

- Futuro/Kaioshin verificam blocos reais e fundação completa; jobs têm limite e limpeza, retomada por checkpoints e diagnóstico detalhado. Viagem ao Futuro repete a preparação inteira após falha anterior à colocação, compartilhando o trabalho com progresso.
- Em terreno legado/protegido, só a cidade opcional é adiada; uma chegada reparada continua exigindo prova real de segurança, sem sobrescrever construções ou fingir cidade concluída.
- Retorno Earth comum com chunks disponíveis, piso/espaço do corpo e alternativas reais. Planetas, regiões, grupos e cajado usam esse caminho; falhas repetidas têm feedback limitado.
- Reviver/Reencarnar persistem intenção e verificam chegada antes dos efeitos; reset aguardado, cliques/reconexão/rollback tratados, sem nova taxa monetária. Proteção do watchdog preservada.
- Cinco paths do planeta passam a Kaioshin; história, Navigator, comandos, traduções e exports coerentes. IDs físicos/propriedades legados preservam saves; Other World/King Kai/Kaioken permanecem fora do rename.
- Mystic imediatamente antes de Lorde Demônio nos cards e seletor, sem reordenar slots salvos.
- 238 testes aprovados; 33 módulos/sintaxe válidos; os mesmos 11 erros antigos no validador geral. Leia `TESTES.md` e `RELATORIO.md` antes de aplicar reparos na cópia. Nenhum save foi reparado nesta sessão.

# Dragon Universe 1.7.7 — correções dos testes no jogo

25 de outubro de 2026. Candidato de teste; Minecraft e reparo do mundo afetado pendentes.

- Kaioshin: bloco simples inválido `minecraft:terracotta` corrigido para `minecraft:hardened_clay`, mantendo saves e proveniência de geração.
- Estruturas: áreas baseadas nos tamanhos reais dos assets, liberação em falhas, metadados aguardados e proteção contra repetir colocação parcial. Sala do Tempo passa de 289 para 12 chunks na origem configurada.
- Futuro: viagem aguarda a preparação compartilhada da cidade com progresso, timeout e cancelamento individual; inspeções de terreno em lotes mantêm verificações de segurança e preservação.
- Voo: base `.0075` para `.028`, mantendo tiers, gravidade/pesos, rápido e custos. A velocidade real ainda precisa ser medida no jogo.
- Mystic aparece antes de Lorde Demônio no menu Glind, sem mudar slots salvos. Todas as raças elegíveis podem aprender Ego e Instinto pelos requisitos normais; modos ativos continuam exclusivos.
- 157 testes aprovados, 33 scripts com sintaxe válida; mesmos 11 erros conhecidos no validador geral. Entrega principal `.mcaddon`; instruções e limites em `TESTES.md` e `RELATORIO.md`.

# Dragon Universe 1.7.6 — viagens, terreno, voo e Mystic

25 de outubro de 2026. Pacote de teste; validação no Minecraft pendente. O alvo declarado é Bedrock 26.52 com Beta APIs, mas o build exato usado no relato ainda não foi confirmado.

- Kaioshin mantém `dbe:kai` e os destinos salvos. Erros distinguem destino, carregamento, geração, chegada e teleporte, preservando a exceção original. A mensagem antiga não provava dimensão incompatível.
- Kaioshin e Futuro separam geração nova de terreno antigo/ambíguo. Chunks novos têm proveniência e verificação; mundos antigos têm reparo limitado com prévia, exclusões e confirmação do token. Não há regeneração ampla automática.
- Futuro mantém a superfície de dirtstone e o ruído existentes, acrescentando base sólida. As rotas do addon exigem preparo real, apoio e espaço para o jogador antes da chegada. A cidade tem preparação delimitada pelos assets antes da colocação, preservando estruturas existentes e bloqueando replay de colocação interrompida.
- Voo corrige bloqueios de entrada/montaria e transições atrasadas encontrados no código. Velocidade, multiplicadores e custos de energia não foram aumentados. O travamento nativo ainda exige teste de direção, subida/descida, parada, transformação, teleporte e reconexão.
- Glind ganha Mystic pelo sistema `ultimate_form`, com nível/skill/custos/domínio normais, sem concessão automática. Ultra Ego e Instinto Superior já compartilhavam as implementações existentes e foram preservados. As formas antigas mantêm índices; Mystic é acrescentado no 8.

Instale **ambos os packs 1.7.6 numa cópia do mundo**, atualizando as cópias efetivamente ativas, inclusive packs embutidos no mundo. Preserve o original. Leia `TESTES.md` para os cenários e comandos de reparo e `RELATORIO.md` para causas, validação e limitações.

Validação desta integração: **133/133 testes aprovados**, **33 scripts** com sintaxe válida, grafo/catálogo conferidos e `git diff --check` aprovado. O validador geral ainda retorna falha pelos **11 erros conhecidos**, sem novos erros nesta rodada. A revisão independente e os resultados de empacotamento estão no relatório de QA e no certificado da entrega.

**Antes de aplicar reparo:** meça a região, proteja todas as construções/escavações com exclusões, gere e revise a prévia. Ar de interiores e construções feitas de blocos naturais não são reconhecíveis automaticamente. Não apague marcadores nem use preenchimento amplo. Preparar uma plataforma não repara a região danificada inteira.

A inicialização da cidade nova solicita uma área de 210 chunks derivada do alcance e dos assets. Capacidade insuficiente deve produzir diagnóstico sem colocação parcial. Disponibilidade, duração dessa preparação, física do voo e resultado visual continuam pendentes no jogo. Os 11 erros conhecidos do validador geral permanecem documentados.

As seções abaixo são histórico; seus números de testes e versões de instalação pertencem às entregas anteriores. Para esta entrega use 1.7.6 e o roteiro atual.

---

## Histórico 1.7.5 — correção de carregamento

Data: 25 de outubro de 2026.
Alvo de teste solicitado: Minecraft Bedrock 26.52, com Beta APIs ativadas.

Esta é uma versão para testes. Ainda não foi executada no Minecraft; não há aprovação de release final.

Verificação atual da 1.7.5: **95/95 testes controlados aprovados**, sintaxe dos **31 scripts** aprovada e **11 erros preexistentes** no validador geral. Os resultados de 41 e 82 testes nas seções históricas pertencem às entregas anteriores. A revisão final está registrada em `docs/QA_STARTUP_HOTFIX.md`.

## Hotfix 1.7.5 — import ausente e componentes inválidos

O teste real do usuário na 1.7.4 falhou com `Import [travel_safety.js] not found`, seguido de erros de componentes/blocos/biomas/receitas.

- O ZIP continha os dois módulos novos, mas `travel_safety.js` e `world_spawn_policy.js` estavam fora do `contents.json`. As entradas foram incluídas. O efeito isolado do catálogo no carregador nativo ainda precisa ser confirmado; a inconsistência de entrega foi reproduzida por um novo teste.
- O import antigo de `./variables` em `regions_data.js` agora usa `./variables.js` explicitamente.
- A validação e o empacotamento agora verificam o grafo real de imports estáticos, arquivos físicos, catálogo dos scripts e dependências declaradas, na fonte e no BP extraído do ZIP. Ausência de script no catálogo passa a bloquear a entrega.
- Os dez componentes customizados usados pelos blocos possuem registro de startup. Um import não resolvido impede a avaliação desses registros e é consistente com a cascata relatada. Componentes, IDs e definições de blocos foram preservados; não foram removidos para ocultar erros.
- Novos testes verificam o defeito da 1.7.4, resolução/imports e registros reais com doubles da API. Isso não substitui o teste no Minecraft.
- Ambos os packs passam a 1.7.5, com UUIDs e saves preservados. Não há reset de personagem nem regeneração de terreno.

### Primeiro teste da 1.7.5

1. Feche o jogo e atualize os dois packs numa cópia do mundo. Substitua as pastas completas, sem misturar versões.
2. O log aponta para o BP dentro do próprio mundo: atualizar somente a biblioteca global pode deixar a cópia 1.7.4 ativa. Confirme 1.7.5 no Content Log e nos dois manifests.
3. Abra uma nova sessão e confira o primeiro erro: nenhum import deve estar ausente. Em seguida verifique os componentes, blocos, biomas e receitas relacionados.
4. Teste crescimento/colheita, porta de ajisa, slabs, placa, esferas e máquina de gravidade. O roteiro `TESTES.md` do ZIP detalha os cenários e as pendências.

## Histórico 1.7.4 — radar, viagens e progressão

- **Radar:** o filtro e as coordenadas consultam diretamente a propriedade sincronizada existente. O marcador exige alvo real e fica oculto sem alvo; a sobreposição continua exclusiva da primeira pessoa. O ciclo de equipar/desequipar limpa o estado antigo, sem ultrapassar as 32 propriedades do jogador.
- **Voo:** regressão não confirmada; nenhuma aceleração artificial foi aplicada. As classes completas e os comandos de velocidade coincidem com o baseline em 400 ticks equivalentes; a medição da distância pela física do Minecraft continua pendente.
- **Viagens:** preparo exige chunks disponíveis antes das consultas, geração e chegada. Áreas temporárias têm espera limitada e limpeza. Viagens de missão aguardam a chegada confirmada; falhas não iniciam tarefas prematuramente. Aura e som também verificam disponibilidade durante a transição. A chegada ao Universo 6 foi alinhada ao piso real, em Y101, preservando o Goku da entrada.
- **Futuro:** zombie, skeleton, creeper e spider vanilla são tratados somente em `dbe:future_trunks`, nos eventos de spawn/carregamento e numa inspeção inicial. É um fallback após o spawn, pois não foi encontrado cancelamento documentado por dimensão personalizada; não há varredura contínua. Mobs do addon e outras regiões são preservados.
- **Glind:** Ultra Ego foi acrescentado após as seis formas antigas; Instinto Superior e Hakai podem ser aprendidos pelos mestres e custos existentes. Os modos ativos continuam exclusivos entre si. Nada é concedido automaticamente. Os três idiomas incluem o nome da nova forma.
- **Beast:** acesso exclusivo a `earthling` (Humano) e `saiyan` (Saiyajin), incluindo menus, aprendizado, ativação e estado salvo. Desbloqueios históricos de outras raças ficam inativos; os índices e progressos não relacionados são preservados.
- **Comerciantes vanilla:** o evento natural `minecraft:wandering_trader_event` é desativado, impedindo a origem do Wandering Trader e suas Trader Llamas. Não altera villagers, llamas comuns ou comerciantes do addon. A execução sem cheats ainda exige teste no jogo; falha do comando gera diagnóstico. O ajuste do evento fica salvo no mundo.
- **Kaioshin:** nome atualizado nos destinos e idiomas, mantendo `dbe:kai`, origens e referências antigas. A geração verifica as 256 colunas antes de registrar conclusão e não suprime falhas de escrita. Chunks já marcados completos não são regenerados automaticamente; o reparo de terreno antigo danificado exige uma operação separada sobre uma cópia revisada do mundo.

### O que testar primeiro

1. Entre numa cópia do mundo antigo com os dois packs 1.7.5. Confira raça, inventário, missões e formas salvas.
2. Radar com/sem alvo: entrar, equipar, trocar de slot, alternar perspectiva, trocar dimensão e reconectar.
3. Faça ida e volta por cada rota, incluindo destinos novos, missão com carregamento demorado, interrupção e dois jogadores. Confira o resultado da chegada além do Content Log.
4. Treine Glind com Whis/Beerus; confirme requisitos, custos, modos exclusivos e persistência. Teste Beast com as sete raças e com desbloqueio antigo.
5. Teste os quatro mobs no Futuro e fora dele; comerciantes naturais globalmente; terreno novo e interrompido de Kaioshin, sem sobrescrever construções antigas.
6. Compare voo normal/rápido e formas equivalentes durante 400 ticks, mantendo atributos, efeitos, energia e condições iguais.

Os ZIPs incluem `TESTES.md` com o roteiro completo e `RELATORIO.md` com causas, evidências e limitações. Testes Node não equivalem a testes dentro do Minecraft.

Validação final da integração: **82/82 testes passaram**, inclusive na revisão independente. Sintaxe dos **31 scripts** aprovada; o validador geral mantém **11 erros preexistentes**, sem novos erros. A entrega está liberada para teste controlado, sem aprovação de produção ou teste nativo.

## Histórico 1.7.3 — erro de raça undefined

O teste do usuário na versão 1.7.2 apresentou `InvalidRaceError: Raça inválida: undefined`, seguido de tarefas consultando um jogador sem raça.

- O pacote 1.7.2 acrescentou uma propriedade ao radar e levou a definição do jogador a **33 propriedades**, ultrapassando o limite de **32**. Esta regressão foi introduzida nessa entrega.
- A propriedade extra foi removida. O radar usa apenas seu campo numérico existente: **0 = sem alvo**; **164164 = alvo no centro**. A definição do jogador volta a ter 32 propriedades.
- A raça é validada antes de criar os gerenciadores do jogador. A conversão de `undefined` para a string `"undefined"` foi removida.
- Uma propriedade de raça ausente agora produz um diagnóstico explícito de carregamento do Behavior Pack. Não é atribuída outra raça automaticamente ao save.
- O registro de raças é inicializado antes das consultas; a compatibilidade Demon → Glind continua.
- O loop de tarefas aguarda o registro da instância e encerra quando ela falhou, foi substituída, removida ou o jogador desconectou.
- O carregamento adiado de missões não usa mais instâncias órfãs.
- O validador agora rejeita definições de entidade com mais de 32 propriedades. O novo teste falhou no schema de 1.7.2 antes da correção.
- **41 testes de regressão passaram** após a correção. O hotfix 1.7.3 ainda precisa ser confirmado no Minecraft.

### Primeiro teste desta correção

1. Atualize **os dois packs para 1.7.5** (que mantém a correção 1.7.3), saia do mundo e entre novamente para recarregar as definições.
2. Entre com o jogador afetado, troque os slots da hotbar e abra menus. Procure novos erros `InvalidRaceError` ou `Jogador ... não possui raça`.
3. Confirme a raça, os atributos, o inventário e as missões existentes. Esta correção não exige resetar o personagem nem criar outro save.
4. Deixe o jogador no mundo por um minuto, reconecte e confira se os erros de tarefas/rejeições retornam.
5. Teste o radar sem alvo, com alvo no centro e olhando verticalmente.

O checklist completo abaixo continua aplicável. O log recebido do usuário se refere ao pacote anterior; não houve teste do hotfix no jogo pelo agente.

## Instalação das pastas

1. Extraia os dois ZIPs. Um contém a pasta `behavior_packs`; o outro contém `resource_packs`.
2. Copie a pasta interna `Dragon Universe_bp` para seu diretório `behavior_packs`, e `Dragon Universe_rp` para `resource_packs`.
3. Em uma cópia do seu mundo, selecione os dois packs na versão **1.7.5** e ative **Beta APIs**.
4. Ative o Content Log para registrar erros durante os testes.
5. Use um mundo novo para comparar com a cópia do mundo antigo.

Os UUIDs originais foram mantidos. A versão dos dois packs, módulos e dependências entre eles foi elevada para 1.7.5 para identificar esta atualização.

## Alterações mantidas da versão 1.7.2

### Combate e criação de inimigos

- Esquiva de Beerus: consulta de blocos/luz adiada para fora do evento restrito; entidade, posição e dimensão são conferidas novamente.
- Falhas no movimento rápido são tratadas, incluindo entidades removidas ou que mudaram de dimensão durante a espera.
- Falha ao inicializar um inimigo limpa o cache e a trava de inicialização; uma entidade recém-criada com erro é removida.
- A limpeza de uma tentativa antiga de missão não apaga o acompanhamento dos inimigos da tentativa nova.
- A geração de inimigos para quando a tentativa é cancelada, o jogador desconecta ou muda de dimensão.

### Glind e Zamasu

- Demon passou a se chamar **Glind**, por decisão do responsável, mantendo os atributos, a posição na lista de raças e a ordem das transformações.
- Saves com o ID antigo `demon` continuam sendo reconhecidos e a propriedade do jogador é convertida para `glind`.
- Requisitos, desejo de mudança de raça e bônus de dano acompanham o nome Glind.
- Zamasu, Zamasu Fusionado e a forma Corrompida passam a encontrar sua definição de raça.
- O jogador continua usando os recursos visuais herdados da antiga Demon; as texturas próprias dos NPCs Zamasu foram preservadas.

### Goku Black e Universo 6

- O encontro de Goku Black de nível 125 na saga Future Trunks usa **Super Saiyajin Rosé**.
- Um encontro antigo salvo com a seleção única Super Saiyajin God, nesse nível, recebe a seleção Rosé ao carregar.
- A forma Rosé usa seus multiplicadores e consumo de ki já existentes; é necessário conferir o balanceamento.
- Goku aparece junto à entrada da arena do Universo 6, em **X 6.5, Y 101, Z 40.5**, na dimensão `dbe:universe_6_arena`.
- O NPC é criado apenas com o local carregado, piso e espaço livre; a cópia marcada existente é reutilizada.

### Radar, Sala do Tempo e transporte

- O radar evita coordenadas inválidas ao olhar verticalmente.
- Um alvo no centro é distinguido de ausência de alvo; o estado é limpo no spawn, troca de dimensão e reset do jogador.
- Monstros vanilla, incluindo slime, esqueleto, aranha e zumbi, são removidos na Sala do Tempo. NPCs customizados, animais e entidades marcadas como parte de missão/amigáveis são preservados.
- A máquina do tempo recebeu persistência contra despawn natural. O armazenamento Hoi-Poi continua possível.
- Ao concluir a última etapa de Future Trunks, o jogador retorna ao lookout na Terra.
- O destino **Terra** do Navegador Estelar rejeita origens salvas no futuro ou em outras dimensões e spawn pessoal fora do Overworld.
- Jogadores que já concluíram a saga podem testar **Navegador Estelar → Terra** para voltar.

### Texto das missões

- Os oito objetivos de viagem de Namek, Kai e Universo 6 passam a mostrar o destino, por exemplo **“Viaje até: Planeta Namek”** e **“Viaje até: Arena do Universo 6”**.
- Nomes de destinos usados pelos requisitos foram completados em português, inglês e espanhol.
- Missões de biomas terrestres, como praia e Dirtstone, mantêm os textos e coordenadas.
- As dimensões próprias dos planetas já existiam e foram preservadas; esta correção de texto não altera a geração dos mundos.

### Preparação dos arquivos

- Entrada de script corrigida no manifest do Behavior Pack: `scripts/index.js`.
- O validador agora informa quando a entrada de script do manifest não existe.
- BP e RP preparados em pastas e ZIPs separados, com este changelog.

## Checklist — o que testar

Marque apenas o que executar no Bedrock 26.52. Em caso de falha, anote o passo, o resultado e o Content Log.

- [ ] **Carregamento:** os dois packs aparecem como versão 1.7.5; mundo abre com Beta APIs, menu e scripts funcionando.
- [ ] **Save antigo:** um jogador salvo como Demon aparece como Glind; inventário, atributos, habilidades, customização e progresso continuam corretos.
- [ ] **Transformações Glind:** desbloqueios e formas antigas continuam disponíveis, sem mudança indevida de ordem.
- [ ] **Zamasu:** iniciar, interromper, reconectar/recarregar e retomar as três lutas; verificar contagem de inimigos, avanço e recompensa.
- [ ] **Dois jogadores:** repetir as lutas com estados diferentes, sem inimigos ou recompensas duplicados.
- [ ] **Beerus:** atacar repetidamente; observar esquiva e Content Log; confirmar dano, morte e recompensa corretos nas demais lutas.
- [ ] **Goku Black:** conferir cabelo/aparência Rosé no encontro de nível 125, novo e salvo, além do consumo de ki e dificuldade.
- [ ] **Radar:** testar ausência de alvo, alvo central, visão vertical, câmeras, reconexão e mudança de dimensão; procurar erros Molang.
- [ ] **Sala do Tempo:** verificar que os monstros citados não permanecem, inclusive após recarregar chunks; NPCs continuam presentes.
- [ ] **Fora da Sala do Tempo:** monstros e missões continuam funcionando normalmente.
- [ ] **Máquina do tempo:** sair da área, recarregar chunks e reconectar; testar guardar/retirar pela cápsula Hoi-Poi sem duplicar.
- [ ] **Fim de Future Trunks:** concluir a última etapa e chegar ao lookout na Terra.
- [ ] **Jogador já preso no futuro:** usar Navegador Estelar → Terra; repetir após reconectar e com origem ausente/inválida.
- [ ] **Goku no Universo 6:** visitar a entrada da arena; sair/voltar, recarregar e entrar com outro jogador; verificar uma única cópia marcada e testar os diálogos.
- [ ] **Textos:** conferir Namek, Kai e as seis missões do Universo 6 com nome de planeta/universo, sem chave interna de bioma nem coordenada indevida.
- [ ] **Biomas terrestres:** missões de praia e Dirtstone ainda apresentam destino e coordenadas corretamente.
- [ ] **Viagens:** visitar os planetas, voltar à Terra e conferir origens individuais com dois jogadores.

## Validação histórica da 1.7.3 fora do Minecraft

- **41 testes de regressão aprovados**, executando métodos de produção com ambiente controlado, incluindo limite de propriedades e ciclo de vida de instâncias inválidas.
- **29 scripts** passaram na verificação de sintaxe.
- A validação geral caiu de 15 para **11 erros preexistentes**, sem novos erros nas verificações.
- Estrutura e conteúdo dos ZIPs conferidos contra os arquivos de origem após extração.

## Pendências conhecidas

- Não houve execução da 1.7.5 no Minecraft. A revisão independente do hotfix está em `docs/QA_STARTUP_HOTFIX.md`.
- O erro Molang originalmente relatado e a causa original do desaparecimento da nave ainda precisam ser reproduzidos no jogo.
- A 1.7.4 acrescentou o filtro dos quatro monstros identificados no Futuro; sua eficácia no jogo continua pendente, assim como o filtro da Sala do Tempo.
- Restam 4 entradas de texturas inexistentes no `contents.json`, 4 texturas de UI ausentes, 2 referências de loot/trading ausentes e a skill `healing_power` sem treinador acessível.
- Compatibilidade real com o resolvedor das APIs beta do Bedrock 26.52 só será confirmada ao carregar os packs no jogo.
