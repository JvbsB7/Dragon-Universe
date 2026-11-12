# 1.7.16: roteiro de teste

Montado em 2026-11-12: o roteiro da 1.7.15 (ainda não executado) mais a seção 8, com o que entrou na 1.7.16.
Marque ✅ funcionou, ❌ falhou ou ⏭️ não testado. Quando falhar: print ou vídeo, Content Log, dimensão e coordenadas.
Nada aqui foi testado no Minecraft pela equipe.

## Quem e onde
- ⚠️ **Não abrir numa versão anterior um mundo que já passou pela 1.7.15 ou 1.7.16.** A versão antiga não entende o plano novo e pode duplicar construções. Teste sempre em cópia.
- Testador · PC Windows ☐ · Android ☐ (modelo: ____) · **versão exata do Minecraft: ____** · data
- Content Log File e GUI ligados · Beta APIs ligado · mundo NOVO + CÓPIA do mundo salvo da 1.7.14

## 1. Abre?
- [ ] O mundo carrega · `loaded __/8` e auditoria `10/10` · primeiro erro do log: ____

## 2. Menu novo (identidade Dragon Universe)
- [ ] Ícone do pacote na lista de pacotes do Minecraft: o "DU" com moldura ciano
- [ ] Estatísticas, skills, missões, treino, notícias e conquistas: painel azul-marinho com moldura ciano, abas com aro azul
- [ ] Ícone DU centralizado acima do painel, **sem ficar cortado** no celular com interface grande e sem cobrir botão ou texto (print no PC e no celular)
- [ ] Passar o mouse ou o dedo: aro ciano e ícone dourado · texto dos botões branco e legível
- [ ] Textos coloridos mandados pelos scripts (missões, NPCs, Shenron) legíveis no fundo novo · ícone de skills visível
- [ ] Loja: botões dourados com texto preto · máquina de gravidade sem mudança

## 2b. Erro de chunk descarregado (H5)
- [ ] Casa do Guru → planeta Freeza pelo Star Navigator, 5 vezes: nenhum `LocationInUnloadedChunkError`
- [ ] Ida e volta do Planeta do Bills e do Torneio do Poder, 3 vezes cada: nenhum erro
- [ ] Folhas ajisa soltam partícula · grama solariscore se espalha e morre no escuro · borboleta e poeira amarela sem erro novo

## 3. Construções (H6–H9)
**Como chegar:** `/scriptevent dbe:landmarks` lista os pontos (e o motivo, se algum foi rejeitado). Ir com `/tp @s X Y Z`. A construção aparece a 64 blocos do ponto. Guru: dentro de Namek. Base do Freeza: dentro do planeta Freeza.
- [ ] `dbe:landmarks` antes e depois de cada visita: copiar as linhas `[Landmarks]`
- [ ] **Red Ribbon, Corporação Cápsula, Torneio de Artes Marciais e Base do Freeza aparecem** (eram o bloqueante da 1.7.14)
- [ ] TP **em cima** do ponto: gera ali ou a no máximo 32 blocos; não "foge" para longe (H7). O jogador é levado a chão livre, sem ficar preso dentro
- [ ] Repetir em criativo, voando dentro da área na hora em que a construção aparece
- [ ] Se aparecer `spot kept, surface not readable yet (wait n)`: copiar a linha
- [ ] Base do Freeza: o ponto aparece em `dbe:landmarks` em até ~1 min no planeta · gera no 1º ponto, sem `found minecraft:chest` · postos e vilarejos já gerados continuam iguais
- [ ] Casa do Guru: altura certa? Se ainda estiver "para baixo", print de lado + coordenadas (H6)
- [ ] Travadas ao gerar a Cápsula e o Torneio (o watchdog acusou pico?)
- [ ] Cada uma inteira, sem `could not place`; sair e voltar não duplica
- [ ] **Mundo salvo da 1.7.14:** aparece `plan updated to v2`, e os marcos desistidos voltam a ser planejados
- [ ] **West City saiu (H9).** Mundo novo: `/scriptevent dbe:structures` não mostra west_city · `dbe:landmarks` mostra capsule_corp com X/Z em até ~1 min · tp perto: a Cápsula gera em planície
- [ ] Mundo da 1.7.14 com West City gerada: a cidade continua intacta, não aparece em `dbe:structures`, log com `plan updated to v2`
- [ ] Mundo da 1.7.14 com a Cápsula já gerada: continua placed, sem duplicar · Cápsula planejada e não gerada: mesmo X/Z de antes, e gera ao chegar
- [ ] Local de uma West City que estava só planejada: nada é gerado ali · se a Cápsula tinha sido planejada ao lado dela, sai sozinha no ponto antigo
- [ ] Mundo novo: tempo até a Base de Freeza aparecer em `dbe:landmarks` e travadas nos primeiros minutos (procurar "slow script" no log)

## 4. Cabelos e Oozaru (H1, H3, H4)
- [ ] **Castanho novo (#5A4032):** saiyajin, estilos 0–9, base: preto × castanho distinguíveis (castanho é marrom, não um "segundo preto") (H1)
- [ ] O mesmo em Ultimate e SSJ4 (principalmente Vegeta SSJ4) · humano: preto × castanho · castanho não se confunde com o ruivo
- [ ] Mundo antigo com castanho já escolhido: mantém o tom antigo até escolher de novo no barbeiro
- [ ] Oozaru e Golden Oozaru, nos 10 estilos, de cima e de trás: sem quadradinhos na cabeça · o Vegeta Oozaru inimigo também (H3)
- [ ] Tela de estatísticas em Oozaru e Golden: **aparece** (grande como na 1.7.13, mas visível) (H4)
- [ ] Barbeiro/personalização: em qual estilo corta ou trava? Anotar o **número que aparece** para cada estilo (H2/G6)
- [ ] Não testados na 1.7.14: atlas 2x de Gohan/Trunks SSJ3/SSJ4 · Beast dos estilos 4/5/6 · prévias de customização, raça e cabelo · Oozaru no mundo abrindo e fechando menus

## 5. Viagens e Kaioshin
- [ ] Tempos de Vegeta, Freeza e Yardrat (1ª viagem): ____ / ____ / ____ (na 1.7.14: 44 s / 50 s / 58 s)
- [ ] Copiar as linhas `[Timing]` da 1ª viagem a Kaioshin e a cada planeta
- [ ] 2 jogadores viajando juntos: **o que aconteceu?** (na 1.7.14 veio só "!") (H10)
- [ ] Kaioshin em mundo novo na 1ª tentativa · se falhar: texto vermelho e linhas `[Kaioshin]`/`[Terrain]`

## 6. Dimensões (não testadas na 1.7.14)
- [ ] Torneio do Poder pelo convite: entra, nasce no chão · usar o convite de novo: volta
- [ ] Bills: agachar 5 s sem convite sai, com convite fica · morrer agachado sem convite
- [ ] Assentos da Cápsula e de Bills · Anunciador do Torneio de Artes depois de reabrir o mundo
- [ ] `/scriptevent dbe:structures` em mundo novo
- [ ] Afastar-se durante a espera da cidade do Futuro: cancela com mensagem

## 7. Mundo antigo (CÓPIA) e regressão
- [ ] Chunks e construções do jogador intactos · personagens salvos iguais
- [ ] `/dbe:pay` negativo recusa · `/dbe:redeem` só operador · sair e entrar preserva os dados

## 8. Novidades da 1.7.16
- [ ] **Raditz (estilo 5):** SSJ, SSJ2 e SSJ3 se distinguem de frente e de costas · SSJ e Ascendido iguais à 1.7.15 · SSJ2 mais espetado, juba em leque · SSJ3 sem franja e juba até o joelho
- [ ] Raditz SSJ3 correndo, pulando e voando: a juba não atravessa as pernas de forma feia (print ou vídeo) · prévia de customização com o estilo 5
- [ ] **Casa do Guru, mundo NOVO:** em Namek, o pilar sai do terreno natural, sem buraco retangular plano nem paredes de terra em volta · pilar inteiro até o chão (sem vão embaixo) · ilha e casa completas · árvores ou morros perto do pilar não atravessam a ilha
- [ ] Mundo onde a casa do Guru já foi gerada: nada muda
- [ ] **Convite da Arena do Universo 6:** aparece como "Convite para o Torneio Universo 6" (receita, inventário e dica do item) · um convite que já estava no inventário continua levando à arena e trazendo de volta
- [ ] Se aparecer `setPermissionCategory ... restricted execution` no log: copiar a linha e dizer qual comando foi usado (H11)

## 9. Enviar
- [ ] Este roteiro marcado + Content Log (PC e celular) + prints numa pasta "Testes" (vídeos de preferência em .mp4)
