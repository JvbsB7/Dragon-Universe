# Roteiro 1.7.11 — execução no Minecraft pendente

Usar mundo novo e cópia de um mundo afetado, ambos com backup externo. Não usar o único save, apagar checkpoints ou forçar teleporte ao void. Importar a candidata apenas após sua entrega auditada e confirmar BP/RP 1.7.11 ativos, Minecraft 26.52 e experiências APIs Beta/Próximo Recurso de Criador.

Registrar PASS/FAIL/PENDENTE, mundo, versão dos packs, dimensão, coordenadas e Content Log por cenário. Nenhum dos cenários abaixo foi executado no jogo pela squad nesta investigação.


| Destino | Entrada existente a usar | Retorno existente |
|---|---|---|
| Vegeta, Freeza, Yardrat | Navigator ou rota orbital correspondente | Navigator Terra; atmosfera retorna a Space |
| Kaioshin | Navigator Kaioshin ou comando existente dbe:kaioshin | dbe:kaioshin_return; alias antigo dbe:kai_return preservado |
| Arena Universo 6 | Navigator Universo 6 ou convite do torneio | Convite dentro da arena ou dbe:tournament_return |
| Hell / Inferno | Fluxo existente de Other World para Hell; comando existente dbe:hell em ambiente de teste autorizado | dbe:hell_return ou escape existente para Other World |
| Space / Namek, controles | Navigator correspondente | Navigator Terra / dbe:namek_return |

Hell não é uma opção do Navigator. O ID persistido de Kaioshin continua dbe:kai; não criar uma dimensão dbe:kaioshin nem migrar os blocos para outro armazenamento.

1. **Carregamento:** abrir o mundo e registrar o Content Log completo desde o início. Não devem ocorrer os três erros de versão válida ausente, failed to load dimension e malformed. Registrar qualquer warning residual sem remover novamente o metadado de versão.
2. **Seis destinos:** usar as rotas normais de Vegeta, Freeza, Yardrat, Kaioshin, Arena do Universo 6 e Hell. Confirmar o destino esperado, preparação antes da chegada, apoio/espaço seguros e ausência de erro de dimensão inválida. Space e Namek são controles adicionais.
3. **Repetição e retorno:** primeira e segunda visita de cada destino; voltar pelo fluxo normal e conferir a origem segura/Terra ou origem apropriada. Testar os caminhos específicos de história, Navigator, arena e Hell sem trocar o destino por um teleporte forçado.
4. **Mundo existente e Kaioshin:** conferir construções/progresso anteriores no armazenamento dbe:kai. Confirmar nomes públicos Kaioshin, aliases antigos e atuais e continuidade de missões já salvas. Other World, King Kai/Senhor Kaio e Kaioken devem permanecer como antes.
5. **Falha segura e recuperação:** numa cópia de desenvolvimento, observar um destino/preparo indisponível sem danificar arquivos do único save. O jogador deve permanecer seguro, receber a categoria correta e poder tentar uma viagem válida depois; sem lease/lock permanente, exceção crua ou spam. Não inventar ausência de dimensão via alteração destrutiva de save.
6. **Terreno e retomada:** sair durante preparo na cópia, reabrir e retomar; conferir perfis de Vegeta/Freeza/Yardrat, bordas, fluidos e builds preservados. Buffer incompleto nunca autoriza chegada. Testar Future, timeouts por inatividade e dois jogadores sem rejeição não tratada.
7. **Regressão da missão:** entregar uma peça ao Kame, conferir um bastão e 15 Zeni, repetir/reconectar sem duplicação; inventário cheio antes do consumo pode liberar o próprio slot. Recuperação histórica/OP segue o protocolo existente; não conceder itens globalmente para o teste.

Se falhar, enviar o primeiro erro completo e o log inteiro, BP/RP ativos e versão, experiências, rota escolhida e dimensão/coordenadas. Não concluir que o jogo é incompatível a partir de mensagem genérica nem atribuir falha a duplicatas sem evidência.

Os comandos /scriptevent existentes e conferidos no source estão em README_QA_1.7.11.md, na seção de entradas. Eles foram revisados no código; sua execução no jogo segue pendente. Usar somente na cópia/mundo novo autorizado para teste.
