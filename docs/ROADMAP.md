# Roadmap — Dragon Universe

> Ordem proposta a partir da auditoria de 2026-10-14. Cada fase só começa após aprovação explícita da equipe. Itens marcados ✅ só são marcados depois de verificados.

## Princípios

1. Estabilidade antes de conteúdo: corrigir perda de save, exploits e bloqueios de campanha primeiro.
2. Nada de novos sistemas em cima do núcleo ofuscado sem antes torná-lo legível.
3. Compatibilidade de save: não renomear namespace `dbe:`, chaves de persistência nem reordenar listas posicionais (transformações, tarefas de missão) sem migração.
4. Toda mudança passa pela validação automática (Fase 2a) e por um checklist de regressão no jogo, executado pela equipe.
5. Versão-alvo: **Bedrock 26.52**.

## Fases

### Fase 1 — Auditoria e documentação
- [x] Auditoria somente leitura
- [x] `docs/ARCHITECTURE.md`, `docs/SYSTEMS.md`, `docs/KNOWN_ISSUES.md`, `docs/ROADMAP.md`, `docs/CREDITS.md`
- [x] `README.md` atualizado
- [ ] Equipe preencher nome, membros e contato (`README.md`, avisos nos packs)

### Fase 2a — Ferramentas de validação (sem dependências externas)
Scripts Node em `tools/`:
- validação de todos os JSON (aceitando comentários);
- referências cruzadas (entidades BP↔RP, texturas, geometrias, sons, ids usados nos dados);
- `node --check` nos scripts;
- integridade dos dados (`races_data`, `skills_data`, missões, chaves de idioma nas três línguas).

### Fase 2b — Correções críticas
Prioridade: C1 (perda de save), C5 (`/dbe:pay`), C6 (backdoor), C3/C4 (Esferas e desejos), C14 (bloqueio da saga Freeza), C2 (cooldowns), C19 (capsule_991), C15 (som), C17/C18 (arquivos e dados).
Correções no núcleo dependem da decisão sobre a Fase 3; as que estão em arquivos legíveis (dados, dimensões, JSON, UI) podem ser feitas antes.

### Fase 3 — Núcleo legível e organização
Estratégia recomendada (aguardando aprovação):
1. Substituir `index.js` por uma versão com as strings decodificadas e formatada (mesmo comportamento) e validar no jogo.
2. Renomear símbolos e extrair módulos por domínio, um de cada vez, testando a cada passo: `core/` (db, entidades, eventos) → `combat/` → `races/` → `skills/` → `flight/` → `training/` → `quests/` → `ui/` → `world/`.
3. Extrair o código duplicado das dimensões para `scripts/shared/` (ruído, geração de chunk, viagem/origem) e unificar os scanners em um único agendador.
4. Substituir o sistema Patreon do autor original pelo sistema próprio da equipe e remover o backdoor.

### Fase 4 — Fundação de gameplay
- Regras de atributos: base → bônus aditivos → multiplicadores agrupados → teto global.
- Transformações salvas por **id** (não por índice), com migração dos saves.
- Registro de progressão: chefes derrotados, missões, dimensões, transformações (alimenta treino mental, títulos e eventos).
- Configuração centralizada de passivas raciais.

### Fase 5 — Gameplay (ordem ajustada por dependência)
1. Treinos: reformular a UI da concentração; treino físico (flexões); treino mental (réplicas de chefes com id/tag próprios para não contar em missões).
2. Passivas raciais e rebalanceamento (true_oni_rage, Kaioken, ultimate_form, lssj).
3. Novos ataques de ki (pipeline por dados) e técnicas (Yardrat, contra-ataque, controle de ki).
4. Transformações e raças: Poder Total Namekiano (antes da Orange, com migração de índice), Cell Max (avaliar como entidade/evento), Cerealianos, Tsufurujins, Moro.
5. NPCs úteis, títulos e filiações.
6. Dimensões (completar Kai e U6; depois Bills, Torneio do Poder, Cereal) e continuação da campanha.
7. Eventos dinâmicos (invasão do exército de Freeza, Black Freeza como estágio raro).
8. Novas Esferas (Super, Daima, Cereal) — **somente após corrigir C3/C4**.

### Fase 6 — Otimização contínua
- Voo: reescrever só depois do núcleo legível (o mecanismo está todo no código ofuscado).
- Quantidade de aldeões nas vilas e entidades por tick.
- Intervalos e consultas por tick.

## Observações sobre o treino físico (flexões com Shift)

Hoje o Shift já carrega ki, transforma (slot 8) e encerra o voo. Proposta: iniciar pelo menu de treino, travar movimento e outras ações durante a atividade, e contar repetições alternando Shift pressionado/solto com tempo mínimo validado no servidor. Em celular/controle, oferecer botão de formulário equivalente.

## Checklist de regressão (manual, no jogo)

Executar após cada mudança relevante:

- [ ] Criar personagem, escolher raça e customização
- [ ] Voo: iniciar, acelerar, pousar, voo com transformação
- [ ] Combate melee, guarda, esquiva, combo
- [ ] Carregar e disparar cada tipo de ataque de ki
- [ ] Transformar e destransformar (incluindo falta de ki)
- [ ] Treinos: sombra e concentração
- [ ] Completar uma missão e receber recompensa
- [ ] Sair e entrar no mundo: progresso, cooldowns e zeni preservados
- [ ] Viajar para Namek, Espaço e voltar à Terra
- [ ] Juntar Esferas e fazer um desejo
- [ ] Multiplayer (2+ jogadores): som de carga, desejos, missões
