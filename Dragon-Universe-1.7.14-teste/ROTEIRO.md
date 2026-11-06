# 1.7.14 — Roteiro de teste

Pacote: branch teste/1.7.14 → Dragon-Universe-1.7.14.mcaddon · SHA-256 cee3f5dd08993447ba3090014591eadf6b285fff80ad92a8211bf813c0776cae
Marque ✅ funcionou, ❌ falhou ou ⏭️ não testado. Quando falhar: print ou vídeo, Content Log, dimensão e coordenadas.

## Quem e onde
- Testador · PC Windows ☐ · Android ☐ (modelo: ____) · **versão exata do Minecraft: ____** · data
- Content Log File e GUI ligados · Beta APIs ligado · mundo NOVO e uma CÓPIA de mundo antigo

## 1. Abre?
- [ ] O mundo carrega · `loaded __/8` e a auditoria de dimensões `10/10` (J-4) · primeiro erro do log: ____

## 2. Tela e créditos
- [ ] Canto inferior esquerdo só com "Dragon Universe", cabendo no PC e no celular
- [ ] Nenhum crédito em nenhuma tela (Notícias, menu) · nenhuma chave crua (ex.: `pack.watermark`) em pt_BR, en_US e es_ES

## 3. Cabelos (prévia: https://claude.ai/artifact/9pxWUiPJUgEDFPEFDsLzeu)
- [ ] Cor **preta** nos estilos 0-9, em base, Ultimate e SSJ4: fica preta (Trunks sem lilás, Vegeta SSJ4 sem marrom, estilo 0 sem azul-marinho)
- [ ] As 6 cores em base, Ultimate e SSJ4 · as outras formas mantêm cor fixa
- [ ] Estilo 0: cabelo novo em todas as formas · SSJ3 e SSJ4 próprios · SSJ5 prata com o formato do SSJ4
- [ ] Estilos 4 Caulifla, 5 Raditz e 6 Gogeta em cubos: base, SSJ, SSJ3, SSJ4 e SSJ5 · print do Raditz de costas
- [ ] SSJ3 e SSJ4 novos de 2 Gohan jovem, 3 Gohan adulto, 8 Trunks e 9 Broly · SSJ5 com o SSJ4 novo
- [ ] Goku (7) e Vegeta (1) iguais à 1.7.13
- [ ] Olhar para cima e para trás, voar e correr com aura: o cabelo longo (Raditz, SSJ3, Broly) não atravessa o corpo de forma feia
- [ ] Capacete esconde o cabelo em todas as formas novas · estilos 4/5/6 encaixam na cabeça, sem z-fighting nem buracos
- [ ] Atlas 2x de Gohan/Trunks SSJ3/SSJ4 nítido e sem deslocamento · Beast dos estilos 4/5/6 com o cabelo novo
- [ ] SSJ5 sem tinta mesmo com cor escolhida, em todos os estilos
- [ ] Barbeiro e personalização passam por todos os estilos sem cortes · anotar o **número que aparece** para cada estilo (G6)
- [ ] Outras raças sem mudança
- [ ] **Como pegar SSJ5:** ter SSJ4 + Instinto Superior → transformar em SSJ4 e ativar o Instinto Superior

## 4. Oozaru
- [ ] Oozaru e Golden, nos 10 estilos: sem quadradinhos na cabeça (se ainda aparecer: print)
- [ ] Tela de estatísticas: Oozaru inteiro · customização, raça e cabelo também
- [ ] No mundo, em 3ª pessoa, abrir e fechar estatísticas, customização e inventário: não pisca nem encolhe · repetir com 2 jogadores

## 5. Viagens e Kaioshin
- [ ] Kaioshin em mundo novo: chega na **1ª tentativa** · se falhar: texto vermelho exato, dimensão onde ficou, e repetir até 10 vezes anotando em qual chegou
- [ ] Anotar se aparece `air-only fill is not reliable` ou `[Kaioshin] chunk … rebuilding` (confirma a causa A; copiar o `observed`)
- [ ] Se falhar: a 1ª linha `Travel Kaioshin failed [...stage=...]` e as linhas `[Kaioshin]`, `[Terrain]` e `[Terrain job]` anteriores
- [ ] Copiar TODAS as linhas `[Timing]` da 1ª viagem a Kaioshin, Vegeta, Freeza e Yardrat e de uma 2ª viagem a planeta já gerado
- [ ] Volta de Kaioshin e de um planeta; terreno de mundo antigo inalterado
- [ ] 2 jogadores viajando ao mesmo tempo: as linhas `[Timing]` saem separadas (#1 e #2)
- [ ] Cópia de mundo antigo com Kaioshin já visitado: viajar de novo; construções do jogador intactas
- [ ] Tempo até chegar em Vegeta, Freeza e Yardrat: ____ / ____ / ____ (1ª viagem e volta)
- [ ] Inferno pelo comando voando · Kaioshin e U6 voando · trocar de dimensão e morrer durante a preparação: cancela
- [ ] Névoa de Kaioshin (vídeo) · voo rápido 30 s sem buracos · rios na borda de chunk

## 6. Construções e dimensões novas
**Como chegar (o jogador não precisa de comando):**
- **Planeta do Bills:** fabricar o **Convite do Bills** na mesa de trabalho: ametista nos 4 cantos, papel nos 4 lados e Cristal de Evolitium no centro. Usar o convite para ir e usar de novo para voltar.
- **Torneio do Poder:** **Convite do Torneio do Poder** com a mesma receita, mas com diamante nos cantos.
- **Construções do mundo:** com permissão de operador, digitar `/scriptevent dbe:landmarks` para listar as coordenadas, e ir até lá com `/tp @s X Y Z`, voando ou andando. A construção surge quando o jogador chega a **64 blocos** do ponto. Ficam a 900–3.500 blocos do spawn (300–1.500 em Namek e no planeta Freeza). Para a Casa do Guru e a Base do Freeza, fazer isso dentro de Namek e do planeta Freeza.
- Anotar se foi fácil ou difícil achar alguma construção **sem** o comando.

**Testes:**
- [ ] **Torneio do Poder pelo convite: entra (J-1, primeiro a testar)** · nasce no chão (J-13) · TPS na chegada e andando (J-3)
- [ ] Usar o convite de novo dentro: volta para onde estava
- [ ] Bills pelo convite · agachar 5 s sem convite: sai · com convite: fica · morrer agachado sem convite (J-11)
- [ ] Mundo normal: Casa do Piccolo · Casa do Yamcha (deserto) · Torre da Red Ribbon · Corporação Cápsula (junto de uma cidade) · Torneio de Artes Marciais (planície)
- [ ] Namek: Casa do Guru · Planeta Freeza: Base do exército do Freeza
- [ ] Cada uma: aparece inteira, sem `could not place` no log (J-2), com cortes de morro/árvore aceitáveis (J-6) · sair e voltar não duplica
- [ ] Travadas nos primeiros 30 s de mundo novo e em mundo plano (J-5)
- [ ] Assentos da Cápsula e de Bills (J-7) · Anunciador do Torneio de Artes depois de reabrir o mundo; fila com 4 jogadores (J-8)
- [ ] `/scriptevent dbe:structures` em mundo novo: cidades planejadas (R-5)

## 7. Futuro e desejos
- [ ] Afastar-se durante a espera da cidade: cancela com mensagem própria
- [ ] Shenron: clicar nos primeiros 10 s e depois fechar o menu: **descrever ou gravar o que a câmera faz (G3)**

## 8. Mundo antigo (somente CÓPIA)
- [ ] Chunks e construções intactos · Futuro sem `Unhandled promise rejection`
- [ ] Outro Mundo: aviso `snake_path_2_12` só uma vez · Kaioshin já visitado: `under repair`/`repaired`
- [ ] Construção sob bolha intacta · construções antigas não cortadas (J-10)

## 9. Regressão
- [ ] `/dbe:pay` com valor negativo recusa · `/dbe:redeem` só para operador · sair e entrar preserva os dados

## 10. Desempenho (PC e Poco X6 Pro)
- [ ] FPS com 8 jogadores Trunks SSJ4 (estilo 8) × 8 jogadores Goku SSJ4 (estilo 7), no mesmo aparelho
- [ ] Travadas ao gerar Kaioshin e Vegeta · FPS parado com o pior cabelo (Vegeta SSJ4 ou Trunks SSJ4, 106 cubos) · vários jogadores · comparar com a 1.7.13

## 11. Enviar
- [ ] Este roteiro marcado + Content Log completo (PC e celular) + vídeos
