# Dragon Universe 1.7.14 — pacote de teste

**Candidata para teste controlado. Ainda não foi testada no Minecraft e não deve ser distribuída.**

| Item | Valor |
|---|---|
| Arquivo | `Dragon-Universe-1.7.14.mcaddon` (21.676.570 bytes, 3044 arquivos) |
| SHA-256 | `cee3f5dd08993447ba3090014591eadf6b285fff80ad92a8211bf813c0776cae` |
| Fonte | commit `56e4aca` (branch `integration/proxima`); base 1.7.13 + construções |
| Alvo | Minecraft Bedrock 26.60, PC (Windows) e Android |
| Versão dos packs | BP/RP `[1,7,14]`, `min_engine_version` `[1,26,50]`, UUIDs iguais aos da 1.7.11 |

Confira o hash antes de instalar: `sha256sum Dragon-Universe-1.7.14.mcaddon` (Linux) ou
`Get-FileHash Dragon-Universe-1.7.14.mcaddon` (PowerShell).

## O que mudou em relação à 1.7.13

- **Construções novas:** Casa do Piccolo, Casa do Yamcha (deserto), Torre da Red Ribbon, Corporação Cápsula (1 por mapa, junto de uma cidade) e Torneio de Artes Marciais (1 por mundo, em planície), no mundo normal. Casa do Guru em Namek e Base do exército do Freeza no planeta Freeza.
- **Dimensões novas:** Planeta do Bills e Torneio do Poder, com entrada por convite fabricado (ametista e diamante). Sem convite, agachar 5 s para sair.
- **Kaioshin:** se a criação rápida do terreno falhar, o mesmo pedaço é refeito bloco a bloco e a viagem continua. O log diz qual bloco foi encontrado.
- **Medição temporária:** linhas `[Timing]` no log das viagens a Kaioshin e aos planetas. Só existe neste pacote de teste.
- **Oozaru:** sem cabelo na cabeça e reduzido para caber nas telas de estatísticas e de personalização.
- **Marca-d'água:** só "Dragon Universe".
- **Cabelos Saiyajin:**
  - O estilo 0 (`du_flare_a`) tem cabelo próprio em todas as formas, com SSJ3 e SSJ4 próprios.
  - Caulifla (4), Raditz (5) e Gogeta (6) agora têm cabelo em cubos.
  - Gohan jovem (2), Gohan adulto (3), Trunks (8) e Broly (9) ganharam SSJ3 e SSJ4 próprios.
  - A SSJ5 usa o formato do SSJ4, em prata.
  - A cor preta deixa o cabelo preto em todos os estilos.

## Limitações conhecidas

- Até 106 cubos por cabelo (Vegeta SSJ4 e Trunks SSJ4); o FPS ainda não foi medido.
- Cabelos longos (Raditz, SSJ3, Broly) podem encostar no corpo com a cabeça muito inclinada.
- A redução do Oozaru nas telas depende de como o jogo desenha a prévia: confirme que ele não encolhe no mundo.
- A primeira viagem a cada planeta ainda prepara 3×3 chunks e pode levar alguns minutos no celular.
- O Torneio do Poder aumenta o tamanho do pacote instalado.

## Como testar sem arriscar mundos

1. **Faça backup externo** dos mundos que importam antes de instalar. Não use o mundo principal.
2. Ative o Content Log em Configurações → Criador: **Content Log File** e **Content Log GUI**.
3. Remova o pacote de teste anterior e instale este.
4. Crie um **mundo novo** com os dois packs (BP e RP) da **1.7.14** e o experimento **Beta APIs** ligado.
5. Para mundos existentes, use somente uma **cópia**.

O roteiro completo para marcar está em [`ROTEIRO.md`](ROTEIRO.md). Primeiros itens: entrar no Torneio do Poder pelo convite e viajar a Kaioshin num mundo novo.
Registre cada resultado com quem testou, plataforma, versão exata do jogo e data. Envie o Content Log completo.
