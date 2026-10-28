# World — regressão de metadados de dimensão, proposta 1.7.11

27/10/2026. Atlas, liberação nominal nova. Esta investigação não retoma o trabalho de terreno da etapa anterior. Proposta local para integração pelo Coordinator; nenhuma afirmação de carregamento ou teleporte executado no Minecraft.

## Resultado e escopo

Foi demonstrada uma regressão no artefato entregue: **as oito definições BP perderam o campo raiz `format_version` na 1.7.10**, enquanto mantiveram exatamente os mesmos objetos `minecraft:dimension` da 1.7.9. Isso corresponde ao estágio indicado pelo novo erro relatado, sem versão válida recebida pelo caller ou encontrada no input. A proposta restaura somente a string raiz **`1.26.50`**, valor da 1.7.9 preservada e do snapshot oficial Mojang retail descrito abaixo.

O patch altera oito JSON e adiciona somente teste, contrato de metadados e este relatório. Scripts, registros, runtime compartilhado, biomas, render, manifestos, catálogos, saves e artefatos179/1710 permanecem intactos. Não houve commit, reset, reimportação, empacotamento, instalação ou ativação de outro agente. Versão1711 é uma proposta de entrega; versionamento/UUIDs e build continuam reservados ao Coordinator.

Raiz readonly usada: `C:/Users/rvmm2/Downloads/DragonUniverse1.7.1E/.maestri/roles/cac3a97f-f5cb-4647-a9f9-83558bb28155/.work/integration`.

Entrega nova isolada em `C:/Users/rvmm2/Downloads/DragonUniverse1.7.1E/.maestri/roles/29de190c-d20f-473f-a1ff-551b482a82e8/dimensions-1711`. Materiais da tarefa Atlas anterior não foram usados como propostas desta etapa ou modificados.

## Causa demonstrada e limite da inferência sobre o loader

1. O mcaddon1710 fornecido tem SHA-256 `aa07e76d8b70a6cf845a81295138ab1aa1c7d1e95af71582c61d7c67e074aea5`. Os oito membros dimensionais foram lidos com verificação CRC e são byte a byte iguais às fontes atuais. As cópias extraídas usadas pelos testes também conferem com esse ZIP.
2. O mcaddon179 preservado tem SHA-256 `443bec7d89726629b895741d1e389615a2eccfa74c3f07871e678a94b3973edd`. Seus oito membros usam `format_version: "1.26.50"`. Depois de remover somente esse metadado para a comparação, todos os objetos físicos são iguais aos da1710. O delta1710 e `API_1.7.10.md` documentam a decisão anterior de remover o campo após um warning de schema.
3. O ledger do log179 distingue severidade e sequência: há warnings dizendo que o membro `format_version` não está no schema, mas também há mensagens de substituição das oito definições registradas por script pelas definições do BP. Logo, esse warning anterior **não demonstrava que o loader deixara de precisar da versão**, nem que o documento BP tivesse sido rejeitado. A retirada eliminou o único metadado explícito de versão nesses arquivos.
4. O novo relato contém `no valid version passed by caller or found in input`, `Failed to load dimension` e `Dimension json file is malformed`. Com os arquivos1710 realmente sem versão, a explicação sustentada é falha na obtenção/seleção de versão do documento antes de utilizá-lo como dimensão. Esta correlação não permite afirmar que toda falha de teleporte tem a mesma causa.

**Inferência delimitada:** seleção de versão e validação dos campos são responsabilidades distintas. O formulário público Mojang retail `DimensionDocument` lista `minecraft:dimension`, omite `format_version` nos campos e declara `dataVersion:1.26.50`; a referência Microsoft do documento lista a string raiz `format_version`. Isso é compatível com o warning de campo e a necessidade de versão coexistirem. Não foi obtido o código privado do loader nem instrumentada sua ordem interna, e não se afirma que o formulário de editor seja o schema completo usado pelo engine. Restaurar o valor anterior é sustentado pelo artefato, documentação e snapshot retail; não é uma tentativa de escolher arbitrariamente outra versão para calar mensagens.

`Dimension json file is malformed` não prova JSON sintaticamente inválido: os oito inputs1710 fazem parse, mas omitem o metadado de versão. Também não prova, isoladamente, incompatibilidade de build, falta de experimento, altura incorreta ou necessidade de registrar uma dimensão alternativa.

## Evidência primária e valor escolhido

Referências consultadas com ferramenta web em27/10/2026; ledger completo com status, URLs e limites em `evidence/primary-sources.json`.

- Microsoft Learn, `dimensiondocument`: raiz `minecraft:dimension`; lista `format_version` do tipo String e sem default. Os componentes documentados correspondem aos existentes. URL: `https://learn.microsoft.com/en-us/minecraft/creator/reference/content/dimensionreference/examples/dimensioncomponents/dimensiondocument?view=minecraft-bedrock-stable`.
- Mojang, release retail `v1.26.50.26`, `forms/dimension/dimensiondocument.form.json`: `dataVersion`1.26.50 e raiz da família correta. URL: `https://raw.githubusercontent.com/Mojang/bedrock-schemas/v1.26.50.26/forms/dimension/dimensiondocument.form.json`.
- Mesmo snapshot: `components.form.json`, `dimensionheight.form.json` e `defaultbiome.form.json` confirmam nomes/estrutura/tipos dos componentes preservados. A altura atual -64/384 está dentro dos intervalos documentados (-512..512 para min_y e16..1024 para height_range).
- Microsoft `dimension_document` descreve **`minecraft:dimension_type`**, outra família. Sua orientação de versão/earliest_version não foi transferida para estes arquivos. URL: `https://learn.microsoft.com/en-us/minecraft/creator/reference/content/dimensionreference/examples/dimensioncomponents/dimension_document?view=minecraft-bedrock-stable`.
- O tutorial oficial Custom Dimension API usa registro por startup. Seu exemplo citado de1.21.90 não é prova de versão para estes JSON BP; não foi usado para escolher um novo formato.
- A referência `DimensionRegistry` documenta `registerCustomDimension(typeId)` no startup e geração void. Isso não certifica um documento BP rejeitado nem justifica trocar suas configurações por uma dimensão script-only. URL: `https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimensionregistry?view=minecraft-bedrock-experimental`.

O link de schema exato fornecido pelo Coordinator (`https://raw.githubusercontent.com/Mojang/bedrock-samples/refs/heads/main/metadata/json_schemas/server/dimensions/1.26.50/Dimension%20Definition.schema.json`) retornou404 na ferramenta conectada, inclusive variante raw. A navegação disponível de `metadata` não expôs esse caminho. **Seu conteúdo não foi recuperado nem validado; não foi inventada uma cópia.** O schema local entregue é identificado como contrato de regressão do projeto e não como esse schema oficial. Esse limite permanece aberto para QA/Coordinator caso consigam recuperar a versão exata.

Não se afirma que1.26.50 seja o único valor aceito pelo Minecraft26.52 ou a versão mínima de todo tipo de dimensão. É o pin restaurado com evidência do arquivo179 e do snapshot primário da família correta. O teste rejeitar1.26.52 significa divergência do pin escolhido, não uma descoberta de que o engine rejeita esse valor.

## Pacote instalado e condições ainda desconhecidas

Get-AppxPackage confirmou `Microsoft.MinecraftUWP_1.26.5203.0_x64__8wekyb3d8bbwe`, Status Ok; o usuário confirmou separadamente tela inicial **Minecraft26.52**. AppxManifest.xml e MicrosoftGame.Config foram lidos e seus hashes registrados. Os manifestos vanilla1.26.50 e1.26.52 instalados também foram lidos; isso fornece contexto de versão, não um teste de carregamento de dimensão.

Não foi localizado schema de dimensão avulso em `data/definitions` ou `data/behavior_packs`; alguns conteúdos ficam em `__brarchive` e não foram decodificados. Nada em WindowsApps foi escrito, desbloqueado ou executado. Estado dos experimentos do mundo ainda pendente. A falha Computer Use sky.list_apps/nativepipe/oserror2 foi informada na coordenação; Atlas não retomou controle gráfico nem abriu mundos. Registro detalhado em `evidence/ENVIRONMENT.md`.

O projeto mantém declaração26.52, mínimo[1,26,40] e dependências beta. A proposta não altera isso e não certifica clientes anteriores a26.52. Não se deduziu um build a partir de erro genérico.

## Objetos e IDs preservados

| Arquivo em `Dragon Universe_bp/dimensions` | ID físico | Bioma preservado |
|---|---|---|
| frieza_planet.json | dbe:frieza_planet | dbe:frieza |
| hell.json | dbe:hell | dbe:hell |
| kaioshin.json | dbe:kai | dbe:kai |
| namek.json | dbe:namek | dbe:namek |
| space.json | dbe:space | dbe:space |
| universe_6_arena.json | dbe:universe_6_arena | dbe:universe_6_arena |
| vegeta.json | dbe:vegeta | dbe:vegeta |
| yardrat.json | dbe:yardrat | dbe:yardrat |

Arena aqui é a definição/rota de Universe6: o const DIM_ID de `universe_6_dimension.js` confirma `dbe:universe_6_arena`. O const de `hell_dimension.js` confirma `dbe:hell`. Isso identifica os IDs reais desses módulos; não atribui toda mensagem genérica do usuário a uma rota sem stack/ID. Kaioshin mantém o armazenamento físico `dbe:kai`; não se cria `dbe:kaioshin` como migração ou substituto.

Todos mantêm geração void, `min_y:-64`, `height_range:384` e o mesmo componente default_biome. As oito declarações de bioma existem e seus IDs foram conferidos com o parser JSON tolerante já existente no projeto. Isso não certifica que os biomas carregaram no engine. Os caminhos BP `dimensions/*.json` já estão em contents.json; nenhuma movimentação, catálogo, render ou terreno foi alterado.

Cada proposta é o byte original1710 com o prefixo raiz `"format_version":"1.26.50",` acrescentado após a primeira chave. O restante dos bytes é preservado. Hashes base,179 e proposta por arquivo estão em `evidence/archive-source-audit.json`; manifesto final de integração em `evidence/delivery-hashes.json`.

## Testes e limites do modelo

`tools/test-dimension-metadata-1711.mjs` usa apenas Node e o parser existente `tools/lib/common.mjs`. O pequeno `tools/schemas/dimension-metadata-1711.schema.json` descreve o contrato de metadados desta correção, explicitamente **não o engine**. O gate implementa apenas esse envelope/pin; não é um validador geral JSON Schema.

| Verificação executada | Resultado |
|---|---|
| Novos11 casos apontando para os oito JSON1710 atuais | 3 aprovados,8 falhas por falta da versão raiz; exit1 |
| Mesmos11 casos nas propostas | 11/11; exit0 |
| Registros/objetos dimensionais existentes selecionados em Systems1710 | 5/5; exit0 |
| Comparação SHA de ZIP179/1710, CRC dos16 membros e cópias extraídas | conferem |
| Preservação de33 scripts, manifestos/catálogos e documentos de referência | conferida novamente no fechamento |
| Sintaxe, whitespace, aplicação do patch em espelho local e hashes resultantes | registro em `evidence/static-and-patch.txt` |

Zero skips/cancelamentos nos testes. Os oito negativos demonstram uma regressão de contrato de **metadados**, não a execução de um loader Minecraft. Os outros casos exercitam ausência/número/tipo/posição da versão, família raiz errada, pin escolhido, inventário dos oito IDs, igualdade completa dos objetos179/1710 e resolução estática das declarações de bioma. Não há mock retornando dimensão disponível, nem fallback que transforme um erro de carregamento em aprovação.

Comandos, executados da raiz Atlas, prefixados pelo RTK configurado:

```text
python dimensions-1711/audit-dimensions.py
DU_DIMENSION_REFERENCE_ROOT=<checkout readonly>
DU_DIMENSIONS_ROOT=<checkout readonly>/Dragon Universe_bp/dimensions
node --test --test-isolation=none --test-reporter=tap dimensions-1711/proposal/tools/test-dimension-metadata-1711.mjs
python dimensions-1711/audit-dimensions.py --propose
DU_DIMENSIONS_ROOT=<unset>
node --test --test-isolation=none --test-reporter=tap dimensions-1711/proposal/tools/test-dimension-metadata-1711.mjs
node --test --test-isolation=none --test-reporter=tap --test-name-pattern="BP authority|All eight BP dimensions" <checkout readonly>/tools/test-systems-native-1710.mjs
python dimensions-1711/audit-dimensions.py --verify
python dimensions-1711/build-delivery.py
python dimensions-1711/build-delivery.py --verify-applied
```

Logs: `metadata-negative.tap`, `metadata-positive.tap`, `existing-dimension-contract.tap`. Em PowerShell as duas atribuições acima são `$env:NOME='valor'`; remover o override de dimensões seleciona o diretório da proposta. Depois de integrar, o teste novo executa diretamente no checkout, sem variáveis. Testes existentes rodaram diretamente na fonte readonly; não se alterou fixture antiga, asserção QA ou helper compartilhado.

## Handoff de interface para Forja, sem editar ou ativar seu agente

1. Manter os oito IDs e objetos físicos desta tabela. Não contornar falha do BP criando uma dimensão script-only de outro ID ou configuração default, nem repetir geração/reparo para mascarar loading. A metadata corrigida precisa ser avaliada separadamente do registro por script.
2. Forja é o próximo dono exclusivo de todos os scripts/registros, incluindo index, Space, Kaioshin, Hell, U6, Namek e shared runtime. World não adicionou/removou subscriber. Verificar a autoridade BP e os runtime-only existentes no startup, preservando Future/Other World/chamber/staff e o ID salvo `dbe:kai`; não assumir que um tutorial script-only resolve a aceitação desses documentos BP.
3. Distinguir diagnóstico de carregamento/versão, registro/obtenção de dimensão, aquisição de chunks, geração/prova de terreno e chegada/retorno. Registrar o ID/etapa e preservar a exceção original. Uma mensagem de viagem genérica não identifica qual desses estágios falhou.
4. Confirmar disponibilidade real após o carregamento apropriado e antes da viagem; não mover jogador nem apagar origem se a definição/registro falhar. Preservar lease, fila, prova de piso/headroom, estados de geração/reparo e retorno já implementados. Não há nova função/interface runtime a integrar de World; somente a correção declarativa e seus testes.
5. O teste antigo de autoridade BP é uma regressão estática, não evidência independente de ordem do loader. Se houver requisito adicional de startup no26.52, demonstrá-lo com evidência aplicável antes de mudar scripts. World não certifica que restauração de metadados resolve por si só todos os IDs inválidos ou todas as rotas.

## Integração e aceite ainda bloqueados no engine

Integrar somente os11 caminhos do patch: oito JSON dimensionais, teste novo, schema de regressão e este relatório. Helpers `audit-dimensions.py`/`build-delivery.py` e a pasta evidence são materiais de revisão locais, não conteúdo do pack. Usar `git -c core.autocrlf=false apply --check --whitespace=error <patch>` e aplicar com a mesma configuração para conferir os hashes LF sem conversão automática.

Coordinator conserva1710/179, cuida da identidade1711/README/manifests e segue a sequência nominal. Forja recebe os requisitos acima quando liberado; ninguém foi ativado por Atlas. QA deve verificar o patch/teste independentemente e recuperar o schema primário exato se disponível.

**Não há aceite nativo.** Em mundo novo e cópia de backup, com os experimentos finalmente registrados, faltam: confirmar seleção/carregamento das oito definições; registrar os IDs efetivos e qualquer warning residual sem retirar a versão cegamente; tentar as rotas Vegeta/Frieza/Yardrat/Kaioshin/Hell/U6 e Space/Namek; manter o jogador na origem em falhas; provar terreno/chegada e retorno normais. A UI/experimentos, o loader real, o registro BP/script e o teleporte não foram executados nesta etapa. A proposta é justificada para corrigir a regressão de metadados; qualquer afirmação de que o problema completo foi resolvido fica bloqueada até esses testes.
