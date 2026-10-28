# Complemento QA 1.7.11 — candidato controlado

27/10/2026. **Fonte aceita condicionalmente para build de candidata; nenhum instalável1711 foi auditado nesta etapa.** O Coordinator ainda deve gerar os três arquivos reais, solicitar auditoria independente e só então avisar o usuário. Minecraft continua sem execução por QA.

## Texto para o README final

A candidata restaura somente format_version1.26.50 na raiz dos oito documentos BP, preservando seus IDs, objetos, biomas, gerador e altura. A falta desse metadado na1710 é uma regressão de artefato coerente com o erro relatado de versão inválida, mas o schema local testa apenas envelope/pin: não substitui o schema integral do engine, cujo URL retornou404, nem confirma carregamento no jogo.

As rotas agora distinguem resolução da dimensão, preparação/dispatch/leitura da origem e conclusão/confirmacão do teleporte. Falhas da origem antes de qualquer consulta não alegam destino indisponível nem movimento. O P2 encontrado pelo QA foi corrigido por Forja: sete negativos passaram sem mudança nos seus asserts. A limpeza permite tentar novamente; causas e fases ficam no Content Log, e o chat usa três chaves localizadas com o ID físico.

Kaioshin continua armazenado como dbe:kai, sem migração para dimensão nova. Other World e os dados de progresso permanecem preservados. Foram exercitados os corpos reais de seis rotas, controles Space/Namek, repetição/retorno, queda de Other World para Hell e falhas de chegada. Fronteiras nativas foram simuladas; evento scriptevent, carregamento, terreno e teleporte reais precisam do teste no Minecraft.

O conjunto focado executou284casos distintos:276passaram e8falharam. Três falhas são contratos históricos preservados (helper inteiro igual à179, exceção crua no chat e allowlist antiga sem as três travel keys); cinco são wrappers EPERM/statusnull. Os cinco payloads originais desses wrappers passaram separadamente nas mesmas asserções, sem virar cobertura extra nem tornar o wrapper10/15 aprovado. O antigo snapshot117pré-locales agora corresponde a116/117na fonte final.

QA11/11, Systems49/49, metadata/validator13/13, Space24/24 e os outros regressores pertinentes passaram conforme o relatório, sem somar sobreposições. O validador geral continua exit1,41erros/42avisos, com34impedimentos ambientais e7diagnósticos herdados. O gate global421 não foi repetido. Não afirmar gate geral verde ou engine confirmado.

## Ambiente e preparação do teste nativo

Alvo relatado: Minecraft26.52, Appx1.26.5203.0, APIs Beta e Próximo Recurso de Criador. O addon é1.7.11 e declara mínimo[1,26,50]; esses números têm significados diferentes.

Depois da auditoria dos instaláveis reais, usar um mundo novo e uma cópia do afetado com backup externo. Confirmar no Content Log os dois packs1.7.11 ativos e registrar build/experiências. Preservar o mundo original; não apagar marcadores, renomear dimensão ou forçar regeneração para ocultar falha de loading.

| Cenário pendente | Ação e resultado esperado |
|---|---|
| Loading das oito definições | Registrar primeiro erro completo e ID; verificar objetos/biomas/altura e ausência de erro de versão/malformed. Metadados parseados não bastam |
| Seis rotas | Vegeta, Freeza, Yardrat, Kaioshin, Arena e Hell: primeira visita, volta e repetição; apoio/headroom reais, causa/fase útil em falha |
| Space/Namek | Terra→Space→Namek→Terra duas vezes, conservando casa/rotação; testar também o caller próprio Namek |
| Kaioshin legado | Navigator/aliases dbe:kai e dbe:kaioshin devem usar a mesma dimensão física dbe:kai e o progresso existente |
| Other World | Queda para Hell mantém política própria; retorno chega ao ponto previsto de Other World, sem substituir King Kai ou origem por outra dimensão |
| Retornos | Origem Terra e origem não terrestre válida; origem ausente/inválida só usa fallback seguro existente; falha mantém evidência |
| Preparo e repetição | Interromper/reconectar numa cópia; pedir viagens com dois jogadores; checar leases/locks/retry e nenhum teleporte atrasado indevido |
| Diagnósticos | Lookup real não vira versão incompatível; leitura da origem/dispatch são preparação. Falha após movimento não promete permanência na origem ou rollback seguro |
| Idiomas | pt_BR/en_US/es_ES: três categorias, um ID físico, sem exceção crua no chat; Future/staff e nomes anteriores intactos |
| Regressão | Terreno/reload e retorno seguro; roupa/custo/recibo e bastão sem duplicação; história/progresso persistem após salvar/reabrir |

Entradas existentes, conferidas no source; não executadas no Minecraft nesta etapa:

```text
/scriptevent dbe:space vegeta
/scriptevent dbe:space frieza
/scriptevent dbe:space yardrat
/scriptevent dbe:kaioshin
/scriptevent dbe:kaioshin_return
/scriptevent dbe:tournament
/scriptevent dbe:tournament_return
/scriptevent dbe:hell
/scriptevent dbe:hell_return
/scriptevent dbe:space space
/scriptevent dbe:space namek
/scriptevent dbe:namek_return
/scriptevent dbe:space earth
```

Hell não é opção do Navigator; use sua entrada existente/queda. Não usar comandos de rebuild/repair para provar loading. Reparo de cópia, se necessário, continua sujeito ao preview/apply/exclusões já documentados.

Em cada cenário registrar PASS/FAIL/PENDENTE, jogador, versão ativa, dimensão/coordenadas, origem antes/depois, primeira exceção completa e Content Log. Se a confirmação falhar após movimento, conferir a posição real e procurar local seguro; não inferir que o personagem ficou na origem.

Não houve Minecraft, alteração de save, benchmark nativo ou teste de crash. A aceitação do usuário e a auditoria dos arquivos reais são etapas pendentes; o relatório QA autoriza somente preparar a candidata controlada.
