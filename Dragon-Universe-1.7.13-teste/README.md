# Dragon Universe 1.7.13 — pacote de teste

**Candidata para teste controlado. Ainda não foi testada no Minecraft e não deve ser distribuída.**

| Item | Valor |
|---|---|
| Arquivo | `Dragon-Universe-1.7.13.mcaddon` (20.971.939 bytes, 2835 arquivos) |
| SHA-256 | `5ab71a54ccdf2f67c56856bdaf0a38c9a4a06ae41b01a15b6ee18fccd9a6bb20` |
| Fonte | commit `be5076e` (branch `integration/1.7.13`); base 1.7.12 candidata |
| Alvo | Minecraft Bedrock 26.60, PC (Windows) e Android |
| Versão dos packs | BP/RP `[1,7,13]`, `min_engine_version` `[1,26,50]`, UUIDs iguais aos da 1.7.11 |

Antes de instalar, confira o hash: `sha256sum Dragon-Universe-1.7.13.mcaddon` no Linux, ou
`Get-FileHash Dragon-Universe-1.7.13.mcaddon` no PowerShell.

## O que mudou em relação à 1.7.12

- **Viagem a Vegeta, Freeza e Yardrat:** prepara uma área menor, mostra o progresso e avisa se já houver viagem em preparação.
- **Namek e Inferno:** preparam uma área menor, com progresso. Voar não cancela mais nenhuma ida a destino fixo (planetas, Espaço, Kaioshin, Arena, Namek e Inferno). Trocar de dimensão continua cancelando.
- **Futuro:** chegada mais segura e sem o erro não tratado da cidade em mundo antigo.
- **Kaioshin:** geração bem mais barata, névoa fechando em 48 blocos para esconder a borda e terreno também sob as bolhas do céu. Em mundo existente, chunks sem terreno sob as bolhas são reparados só se tiverem apenas o vidro esperado; o reparo não se desfaz, então use uma cópia.
- **Planetas:** a verificação do terreno ficou mais barata; o terreno gerado não muda.
- **Estruturas:** um trecho da Estrada da Serpente preso de sessão anterior é recolocado. As demais estruturas continuam preservadas.
- **Desejo:** abrir o menu encerra a cena do dragão e devolve a câmera.
- **Cabelos Saiyajin:** Vegeta (estilo 1), Gohan jovem (2), Gohan adulto (3), Goku (7), Trunks (8), Broly (9) e o novo `du_flare_a` (0). As opções foram de 7 para 10. Os índices 0 a 6 continuam válidos.

## Limitações conhecidas

- Cor do Cabelo: vale na base e nas transformações que já aceitam cor; as demais têm cor fixa, como no addon. A intensidade da cor ainda precisa ser conferida.
- Formas ausentes no mod repetem a forma mais próxima do mesmo personagem (por exemplo, Broly SSJ2 e SSJ3 iguais ao SSJ).
- A espera da cidade do Futuro e as viagens de volta ainda cancelam ao se afastar mais de 32 blocos, de propósito.
- Broly LSSJ fica 1 pixel acima da cabeça.
- Até 106 cubos e 59 ossos por modelo: o FPS ainda não foi medido.
- O botão Aleatório não sorteia os estilos 7 a 9; eles são escolhidos manualmente.

## Como testar sem arriscar mundos

1. **Faça backup externo** dos mundos que importam antes de instalar. Não use o mundo principal.
2. Ative o Content Log em Configurações → Criador: **Content Log File** e **Content Log GUI**.
3. Instale abrindo o `.mcaddon` no PC, ou pelo gerenciador de arquivos no Android.
4. Crie um **mundo novo** com os dois packs (BP e RP) da versão **1.7.13** e o experimento **Beta APIs** ativado. Anote todos os experimentos que o 26.60 pedir.
5. Se quiser testar um mundo existente, use uma **cópia** com backup.

## O que verificar primeiro

1. O mundo abre e o script carrega. Copie o Content Log **inteiro** e anote o **primeiro erro**.
2. **Cabelos:** Goku SSJ, Broly base e `du_flare_a`, depois os demais: frente, lado e costas, **Cor do Cabelo**, formas repetidas e o **FPS**, principalmente no Android.
3. **Vegeta, Freeza e Yardrat** pelo Navigator, sem sair do mundo: anote o tempo até a chegada.
4. **Namek** voando na horizontal durante a preparação: deve chegar. **Inferno** pela queda do Outro Mundo.
5. **Futuro** três vezes seguidas e, em cópia de um mundo antigo, sem `Unhandled promise rejection`.
6. **Kaioshin:** em mundo novo, voe rápido em linha reta por cerca de 30 s e volte; não pode haver buracos. Confira o terreno a 170–310 blocos ao norte da chegada, sob as bolhas. Em cópia de mundo antigo, procure `repaired` e `kept legacy` no log. Um voo muito rápido ainda pode ultrapassar a geração.
7. **Dragão:** clique nele nos primeiros 10 s; a câmera volta e o menu abre. São até 3 desejos por invocação, e o dragão some depois.
8. **Estrada da Serpente** em cópia do mundo que teve o trecho preso.
9. Repita o que passou na 1.7.12: pay, redeem, créditos, Bulma e sair e entrar. Confira se o crédito cabe na marca-d'água.

Os casos com ID estão em `relatorios/R_1.7.13.md`, seção 4, no ambiente da equipe.
Registre cada resultado com plataforma, versão exata do jogo, experimentos, data e quem testou.

## Licença dos cabelos

Os arquivos `du_dmz*` vêm do DragonMineZ 2.2.1 (Yuseix300 e ezShokkoh), sob GPL-3.0; o texto está em `LICENSE-DragonMineZ-GPL-3.0.txt`.
