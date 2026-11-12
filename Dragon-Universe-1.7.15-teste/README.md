# Dragon Universe 1.7.15: pacote de teste

**Candidata para teste controlado. Ainda não foi testada no Minecraft e não deve ser distribuída.**

| Item | Valor |
|---|---|
| Arquivo | `Dragon-Universe-1.7.15.mcaddon` (21.705.534 bytes, 3047 arquivos) |
| SHA-256 | `5de8bb22401a83fc5b5096e1eba02f6cb672f7b030a652c1f18e65c1dd7b5533` |
| Fonte | commit `14cc8ff` (branch `integration/proxima`): 1.7.14 com as correções do teste da 1.7.14 |
| Alvo | Minecraft Bedrock 26.60, PC (Windows) e Android |
| Versão dos packs | BP e RP `[1,7,15]`, `min_engine_version` `[1,26,50]`, UUIDs iguais aos da 1.7.11 |

Antes de instalar, confira o hash com `sha256sum Dragon-Universe-1.7.15.mcaddon` (Linux) ou `Get-FileHash Dragon-Universe-1.7.15.mcaddon` (PowerShell).

## O que mudou em relação à 1.7.14

- **Menu:** os menus trocam o marrom pela identidade Dragon Universe. O painel fica azul-marinho, com moldura ciano e o ícone DU no topo. O ícone do pacote também passa a ser o DU.
- **Construções:**
  - Red Ribbon, Corporação Cápsula, Torneio de Artes Marciais e Base do Freeza voltam a ser geradas.
  - O teleporte para cima do ponto não muda mais a construção de lugar: ela é gerada ali ou a até 32 blocos.
  - Quem estiver na área da construção é levado para chão livre.
  - `/scriptevent dbe:landmarks` passa a mostrar por que um ponto foi rejeitado.
- **West City:** sai do jogo. A Corporação Cápsula escolhe o lugar sozinha, em planície ou floresta. Em mundos antigos, a West City que já foi gerada continua intacta.
- **Base do Freeza:** o sorteio evita os pontos onde o planeta coloca postos do exército.
- **Erro `LocationInUnloadedChunkError`** (folhas e partículas perto de chunk descarregado): corrigido.
- **Oozaru:** sem quadradinhos na cabeça e de novo visível na tela de estatísticas. Ele volta ao tamanho da 1.7.13: grande, mas aparece.
- **Cabelo:** o castanho muda para `#5A4032`, que agora se distingue do preto. O Vegeta também foi ajustado.
- **Medição temporária:** as linhas `[Timing]` continuam no log das viagens. Existem só nos pacotes de teste.

## Limitações conhecidas

- **Não abra na 1.7.14 um mundo que já passou pela 1.7.15.** A versão antiga não entende o plano novo de construções e pode duplicá-las.
- Quem já tinha escolhido castanho continua com o tom antigo até escolher a cor de novo no barbeiro.
- O ícone DU do menu pode ficar cortado no topo da tela em celulares com a interface grande.
- Os arquivos da West City continuam no pacote, mas nada mais os usa.
- Os itens H2 (barbeiro), H6 (altura da Casa do Guru) e H10 (dois jogadores viajando) ainda esperam detalhes ou prints.

## Como testar sem arriscar mundos

1. **Faça backup externo** dos mundos importantes. Não teste no mundo principal.
2. Ligue o Content Log em Configurações → Criador: **Content Log File** e **Content Log GUI**.
3. Remova o pacote de teste anterior e instale este.
4. Crie um **mundo novo** com os dois packs (BP e RP) da **1.7.15** e o experimento **Beta APIs** ligado.
5. Para mundos existentes, use somente uma **cópia**. A cópia de um mundo da 1.7.14 testa a migração.

O roteiro completo para marcar está em [`ROTEIRO.md`](ROTEIRO.md). Comece pelas construções, item 3: foram o bloqueio da 1.7.14.
Registre cada resultado com o nome de quem testou, a plataforma, a versão exata do jogo e a data. Envie o Content Log completo. Coloque os prints na pasta "Testes".
