# Systems1711 — leitura da origem antes de lookup

Entrega incremental de Forja em 27/10/2026, exclusivamente sobre o checkout integrado atual do Coordinator. A base já inclui dispatch e as três traduções Prisma. Não reaplicar o patch anterior: esta entrega tem diretório, patch e manifesto próprios. Checkout e teste QA foram somente lidos.

## Causa e correção mínima

O teste independente do Crivo tem três famílias, desdobradas em sete testes TAP: `safeReturnToEarth` com getter `location` lançando; entrada Hell com getter `dimension` lançando; e leitura da propriedade de origem lançando em cada um dos cinco retornos Space/Kaioshin/Arena/Hell/Namek. Todos falhavam na base integrada, antes de qualquer consulta de dimensão ou movimento: recebiam categoria de lookup (ou teleporte no retorno Space), embora a leitura da origem ainda estivesse em preparação. Esta precisão documental do Coordinator não altera a proposta nem as provas de Forja.

O helper compartilhado agora classifica a fase interna `origin` como `preparation`. `safeReturnToEarth` começa em `origin` e muda para `lookup` imediatamente antes de `world.getDimension`. Os cinco callers de retorno começam na mesma fase; os quatro com consulta direta de origem não terrestre marcam explicitamente `lookup` imediatamente antes dela. A guarda inicial de Hell também fica em `origin` até sua primeira consulta. Space passa o ID físico da Terra e sua fase ao relatório; após retorno concluído, mantém falhas subsequentes na categoria de teleporte.

Os demais callers de entrada Space/Kaioshin/Arena/Namek já consultam o destino antes de ler a origem, com fase `generation` durante essa leitura; as três bridges Space continuam usando `dispatch`. Não precisaram de alteração. A preparação interna de `safeTeleport` já envolve suas leituras antes de movimento na categoria de preparação existente.

A causa original continua no encadeamento de `TravelError` ou no diagnóstico do erro original do caller. Não foram alterados exceções, controle de fluxo, pontos de retorno, parsing de origem salva, fallbacks, leases, timeouts, readiness, provas de chegada ou interrupção após movimento. As rotinas existentes de `finally` liberam pending/travelling/áreas; os testes exercitam nova tentativa após a falha. Não há lookup nem movimento nos sete negativos.

## Allowlist de integração

Somente estes seis arquivos entram no patch, todos em `Dragon Universe_bp/scripts/`:

- `travel_safety.js`
- `space_planets.js`
- `kaioshin_dimension.js`
- `hell_dimension.js`
- `universe_6_dimension.js`
- `namek_dimension.js`

`hashes.json` contém os SHA-256 base/proposta de cada arquivo e do patch. `baseline.json` registra a base integrada, incluindo travel `bdf914e9…` e Space `d807e4d9…`. A geração verifica 47 hashes do congelamento atual, o QA original, a cópia idêntica do fixture Systems e os três artefatos da entrega anterior. Não há patch de testes, index, JSON, manifests, locales, registro, terreno ou arquivos 179/1710.

## Contrato Prisma e Runa

Permanecem exatamente as três chaves existentes, com um único parâmetro: o ID físico do destino. Não há alteração de rawMessage, locales ou nomes públicos.

| Chave | Fases internas |
| --- | --- |
| `dbe.travel.failed.lookup` | `lookup`, após iniciar consulta real ao destino |
| `dbe.travel.failed.preparation` | `origin`, `destination`, `dispatch`, `loading`, `generation`, `arrival`, `transaction`, antes de movimento |
| `dbe.travel.failed.teleport` | falha de teleporte ou já marcada `afterTeleport`; demais classificações existentes preservadas |

Falha lendo origem não afirma ausência de dimensão. O log preserva ID, fase e exceção original; chat não expõe a exceção. A deduplicação existente continua igual. Future e o limite pós-movimento continuam como na entrega integrada; não foi inventado rollback.

## Evidência executada

| Verificação | Resultado |
| --- | --- |
| QA original contra checkout integrado, antes da correção | 0/7; sete falhas reproduzidas |
| Mesmo QA, sem editar asserts, contra proposta local | 7/7 |
| Systems integrado, fixture byte a byte idêntico | 49/49 |
| core-returns-178 + earth-return-178 + recovery-qa-178 | 37/37 |
| Future: somente wait feedback + loading failure | 2/2 |
| `node --check` nos seis scripts | aprovado |
| `git -c core.autocrlf=false apply --check --whitespace=error-all` contra checkout atual | aprovado; nenhuma aplicação |

Os testes positivos tiveram zero skips, cancelamentos ou marcações TODO. TAP integral e verificações estáticas em `evidence/`, normalizado apenas de encoding/finais de linha para UTF-8/LF. Os 95 testes positivos são os grupos acima, não um gate global. O QA externo permaneceu com SHA-256 `9180146a61f4e7504dd40bcaf10037ac86eb31ff7d0d6ad4bafdf2c8ad5da232`; o fixture Systems com `09a297f62ebb3efd724a9e5bf1cf41cd53829b65bdaf511746a3fb3b5186840d`.

## Comandos reproduzíveis

Executar em PowerShell, a partir da raiz Forja. `$checkout` é a fonte Coordinator registrada em `baseline.json`; `$qa` é o teste Crivo registrado no mesmo arquivo; `$tools = Join-Path $checkout 'tools'`.

```powershell
$base = Get-Content systems-1711-origin-read/baseline.json -Raw | ConvertFrom-Json
$checkout = $base.checkout
$qa = $base.qa_test
$tools = Join-Path $checkout 'tools'
# Negativo reproduzido antes da correção, fonte somente leitura:
$env:DU_QA_ROOT = $checkout
node --test --test-isolation=none --test-reporter=tap $qa
# Positivo: mesmo teste, proposta local:
$env:DU_QA_ROOT = (Resolve-Path systems-1711-origin-read/proposed).Path
node --test --test-isolation=none --test-reporter=tap $qa
$env:DU_SYSTEMS_REFERENCE_ROOT = $checkout
node --test --test-isolation=none --test-reporter=tap systems-1711-origin-read/proposed/tools/test-systems-dimensions-1711.mjs
node --import ./systems-1711-origin-read/overlay.mjs --test --test-isolation=none --test-reporter=tap "$tools/test-core-returns-178.mjs" "$tools/test-earth-return-178.mjs" "$tools/test-recovery-qa-178.mjs"
node --import ./systems-1711-origin-read/overlay.mjs --test --test-isolation=none --test-reporter=tap --test-name-pattern='Future wait feedback|Future loading failure' "$tools/test-future-travel-179.mjs"
```

O overlay redireciona somente a leitura dos seis scripts ativos para a proposta. Não muda asserts, fixtures congelados ou arquivos na fonte. A cópia local inalterada do teste Systems existe apenas para resolução de caminhos do harness; não é parte do patch.

## Limites e texto para README final

Falhas ao ler a origem de viagem agora são reportadas como preparação, sem indicar falsamente que o destino está indisponível. O diagnóstico mantém ID e causa original; a limpeza permite tentar novamente. Lookup real, destinos, retorno, fallback e comportamento após movimento foram preservados.

Não houve execução no Minecraft: mocks não provam carregamento de dimensões no engine 26.52/Appx 1.26.5203.0. Não foram reexecutados o gate global 421 nem suites antigas completas 55/74. O subset Future acima não certifica o restante dessa suite; conflitos históricos e testes subprocess bloqueados por EPERM continuam com seus limites anteriores, sem nova execução ou alegação de resolução. Nenhum EPERM ocorreu nos comandos desta entrega. Nenhuma integração, build, alteração de saves, empacotamento ou commit foi feita.
