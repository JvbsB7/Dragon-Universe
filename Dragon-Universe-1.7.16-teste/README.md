# Dragon Universe 1.7.16: pacote de teste

**Candidata para teste controlado. Ainda não foi testada no Minecraft e não deve ser distribuída.**

| Item | Valor |
|---|---|
| Arquivo | `Dragon-Universe-1.7.16.mcaddon` (21.711.654 bytes, 3049 arquivos) |
| SHA-256 | `b4720132cf730a2fcbfad28be927983d58a9c575fea336922d5f00e9d21a83ac` |
| Fonte | commit `ed61ce2` (branch `integration/proxima`): 1.7.15 com os pedidos de 2026-11-12 |
| Alvo | Minecraft Bedrock 26.60, PC (Windows) e Android |
| Versão dos packs | BP e RP `[1,7,16]`, `min_engine_version` `[1,26,50]`, UUIDs iguais aos da 1.7.11 |

Antes de instalar, confira o hash com `sha256sum Dragon-Universe-1.7.16.mcaddon` (Linux) ou `Get-FileHash Dragon-Universe-1.7.16.mcaddon` (PowerShell).

## O que mudou em relação à 1.7.15

- **Raditz (estilo 5):** SSJ, SSJ2 e SSJ3 ficam diferentes. O SSJ continua igual. O SSJ2 ganha modelo próprio, mais espetado e com a juba em leque. O SSJ3 fica sem franja, penteado para trás, com a juba até o joelho.
- **Casa do Guru (Namek):** o pilar sai do terreno natural, sem o buraco retangular com paredes de terra em volta. Vale para casas geradas a partir desta versão.
- **Convite da Arena do Universo 6:** passa a se chamar "Convite para o Torneio Universo 6". O item é o mesmo, e os convites que já existem continuam funcionando.

Todo o resto é igual à 1.7.15. Os itens da 1.7.15 ainda não foram testados e continuam no roteiro.

## Limitações conhecidas

- **Não abra numa versão anterior um mundo que já passou pela 1.7.15 ou pela 1.7.16.** A versão antiga não entende o plano novo de construções e pode duplicá-las.
- Uma Casa do Guru que já foi gerada continua com o recorte. Para ver a correção, use um mundo novo ou um Namek ainda não visitado.
- Erro conhecido, ainda sem correção (H11): usar um comando do addon logo ao entrar, antes de o personagem existir, pode gerar `setPermissionCategory ... restricted execution` no log. Se aparecer, copie a linha e o comando usado.
- Quem já tinha escolhido castanho continua com o tom antigo até escolher a cor de novo no barbeiro.
- O ícone DU do menu pode ficar cortado no topo da tela em celulares com a interface grande.
- Os arquivos da West City continuam no pacote, mas nada mais os usa.
- **Medição temporária:** as linhas `[Timing]` continuam no log das viagens. Existem só nos pacotes de teste.

## Como testar sem arriscar mundos

1. **Faça backup externo** dos mundos importantes. Não teste no mundo principal.
2. Ligue o Content Log em Configurações → Criador: **Content Log File** e **Content Log GUI**.
3. Remova o pacote de teste anterior e instale este.
4. Crie um **mundo novo** com os dois packs (BP e RP) da **1.7.16** e o experimento **Beta APIs** ligado.
5. Para mundos existentes, use somente uma **cópia**. A cópia de um mundo da 1.7.14 testa a migração.

O roteiro completo para marcar está em [`ROTEIRO.md`](ROTEIRO.md). Comece pelas construções, item 3: foram o bloqueio da 1.7.14.
Registre cada resultado com o nome de quem testou, a plataforma, a versão exata do jogo e a data. Envie o Content Log completo. Coloque os prints e vídeos na pasta "Testes" (vídeos de preferência em .mp4).
