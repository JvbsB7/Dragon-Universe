# Dragon Universe 1.7.12 — pacote de teste

**Candidata para teste controlado. Ainda não foi testada no Minecraft e não deve ser distribuída.**

| Item | Valor |
|---|---|
| Arquivo | `Dragon-Universe-1.7.12.mcaddon` (20.836.208 bytes, 2717 arquivos) |
| SHA-256 | `18d5f33dcf863a912eab0469b688adea24eeb55d1e40cbe5ee54431264c518ab` |
| Fonte | commit `694ff9c` (branch `integration/1.7.12`); base 1.7.11 dos ZIPs de teste |
| Alvo | Minecraft Bedrock 26.60, PC (Windows) e Android |
| Versão dos packs | BP/RP `[1,7,12]`, `min_engine_version` `[1,26,50]`, UUIDs iguais aos da 1.7.11 |

Antes de instalar, confira o hash: `sha256sum Dragon-Universe-1.7.12.mcaddon` no Linux, ou
`Get-FileHash Dragon-Universe-1.7.12.mcaddon` no PowerShell.

## O que mudou em relação à 1.7.11

- **Saves:** um save de jogador corrompido é guardado à parte (`<id>__corrupt_*`) em vez de ser apagado. Uma falha de gravação não interrompe mais as gravações seguintes.
- **`/dbe:pay`:** aceita só inteiros positivos. Valores negativos e pagamentos para si mesmo são recusados.
- **Privilégio por nome removido:** nenhum nome de jogador recebe papel automaticamente.
- **`/dbe:redeem`:** criação e validação restritas a operador. Código desconhecido é recusado e não grava nada.
- **Desejos:** trava por dragão. Fechar o formulário encerra a sessão e o dragão continua no mundo. O limite de desejos é conferido de novo no envio.
- **Futuro:** uma colocação interrompida da cidade não bloqueia mais a viagem; a cidade fica para depois. O comando de operador `/dbe:future_city status|preview|apply` mostra o estado e libera a trava.
- **Estruturas:** uma falha conta como tentativa (no máximo 5). O comando de operador `/dbe:structures_retry` libera uma nova tentativa.
- **Diagnóstico:** ao carregar o mundo, o Content Log informa se alguma das 8 dimensões não existe.
- **Apresentação:** os créditos anteriores e o Patreon antigo saíram dos textos. As falas da Bulma em "Indo para o Futuro" foram preenchidas.
- **Piloto de cabelo:** novo cabelo volumétrico `du_spiky_a`, só para Saiyajin no estilo 0 (base, SSJ e ASSJ). Os demais estilos não mudam.

## Como testar sem arriscar mundos

1. **Faça backup externo** dos mundos que importam antes de instalar. Não use o mundo principal.
2. Ative o Content Log em Configurações → Criador: **Content Log File** e **Content Log GUI**.
3. Instale abrindo o `.mcaddon` no PC, ou pelo gerenciador de arquivos no Android.
4. Crie um **mundo novo** com os dois packs (BP e RP) da versão **1.7.12** e o experimento **Beta APIs** ativado. Anote todos os experimentos que o 26.60 pedir.
5. Se quiser testar um mundo existente, use uma **cópia** com backup.

## O que verificar primeiro

1. O mundo abre e o script carrega. Copie o Content Log **inteiro** e anote o **primeiro erro**.
2. A linha do diagnóstico de dimensões (`loaded N/8`) e qualquer erro de dimensão ausente.
3. Viagem para cada destino e volta: Vegeta, Freeza, Yardrat, Kaioshin, Arena U6, Espaço, Namek e Inferno (pelo comando ou pela queda do Outro Mundo).
4. `/dbe:pay` com valor negativo (deve recusar). Pedido de desejo com o formulário fechado no meio (o jogador não pode ficar preso).
5. O cabelo novo em Saiyajin estilo 0: frente, lado e costas, com e sem capacete, na base e em SSJ.

O plano completo, com os IDs de cada caso, está no relatório de QA da equipe (B6_B2).
Registre cada resultado com plataforma, versão exata do jogo, experimentos, data e quem testou.
