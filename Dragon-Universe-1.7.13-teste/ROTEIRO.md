# 1.7.13 — Roteiro de teste

Pacote: branch teste/1.7.13 → Dragon-Universe-1.7.13.mcaddon · SHA-256 5ab71a54ccdf2f67c56856bdaf0a38c9a4a06ae41b01a15b6ee18fccd9a6bb20
Para cada item marque ✅ funcionou / ❌ falhou / ⏭️ não testado e anote o que viu.
Em falha, mande: print ou vídeo + Content Log + onde estava (dimensão e coordenadas).

## Quem e onde
- Testador: ______
- Plataforma: PC Windows ☐ · Android ☐
- Versão exata do Minecraft: ______
- Data: ______

## 0. Preparar (obrigatório)
- [ ] Backup dos mundos importantes, fora do jogo. Não use o mundo principal
- [ ] Configurações → Criador: ligar **Content Log File** e **Content Log GUI**
- [ ] Remover o pacote de teste anterior e instalar este
- [ ] Mundo NOVO com BP **e** RP 1.7.13 ativados
- [ ] Experimento **Beta APIs** ligado (outros que o jogo pedir: ______)

## 1. Abre?
- [ ] O mundo carrega sem travar
- [ ] Esperar 60 s parado, sair e copiar o **Content Log inteiro**
- [ ] Primeiro erro do log: ______
- [ ] Linha de dimensões: `loaded __/8` (esperado 8/8)

## 2. Viagens (mundo novo, sem sair do mundo entre elas)
- [ ] Vegeta pelo Navigator: aparecem "Partindo…" e "n de 9". **Tempo até chegar: ____ s**
- [ ] Usar o Navigator durante a preparação: aviso de viagem já em preparação
- [ ] Freeza: chega. **Tempo: ____ s**
- [ ] Yardrat: chega. **Tempo: ____ s**
- [ ] Namek voando na horizontal por mais de 32 blocos durante a preparação: chega
- [ ] Inferno pelo comando, voando durante a preparação: chega
- [ ] Inferno pela queda do Outro Mundo (y < −48): chega
- [ ] Kaioshin e Arena U6 voando durante a preparação: chegam
- [ ] Trocar de dimensão durante a preparação: a viagem cancela
- [ ] Morrer durante a preparação de Vegeta: vai ao Outro Mundo e a viagem cancela
- [ ] Volta de cada destino cai em lugar seguro

## 3. Kaioshin (mundo novo)
- [ ] Log sem `air-only fill is not reliable` e sem `block queries do not report air`
- [ ] Parado e andando: a névoa esconde a borda do terreno. **Gravar vídeo**
- [ ] Com chuva, se acontecer: a névoa continua fechada e a cor fica aceitável
- [ ] Voar rápido em linha reta por 30 s e voltar: sem buracos. O terreno acompanhou o voo? ______
- [ ] Ir a 170–310 blocos ao norte da chegada: chão sob as bolhas e bolhas intactas
- [ ] Procurar no log `Unowned nonempty chunk` / `marked legacy`: anotar coordenadas e bloco
- [ ] Olhar rios na borda de chunks: há buraco permanente ao lado? ______

## 4. Desempenho (PC e Android)
- [ ] Travadas ao gerar Kaioshin, inclusive sob a bolha maior: ______
- [ ] Travadas ao gerar Vegeta: ______
- [ ] FPS parado com Vegeta SSJ4 (pior cabelo, 106 cubos): ______
- [ ] FPS com vários jogadores, se possível: ______
- [ ] Se tiver a 1.7.12 no mesmo aparelho, comparar: ______

## 5. Cabelos Saiyajin
Primeiro: Goku SSJ, Broly base e `du_flare_a`.
- [ ] Criar personagem sem "Aleatório": começa com cabelo preto
- [ ] Barbeiro e personalização passam pelos 10 estilos, sem cortes
- [ ] Estilo 0 (`du_flare_a`): base e SSJ/ASSJ; voltar à base restaura o cabelo
- [ ] Estilo 1 Vegeta · 2 Gohan jovem · 3 Gohan adulto · 7 Goku · 8 Trunks · 9 Broly: frente, lado, costas e cima, sem cubos soltos
- [ ] Passar por todas as transformações em cada estilo, inclusive deus, blue, beast e SSJ5
- [ ] Oozaru: sem cabelo e sem erro
- [ ] Trocar as 6 cores na base, Ultimate e SSJ4: cor legível. Outras formas mantêm cor fixa
- [ ] Estilos 4, 5 e 6 sem mudança; outras raças sem mudança
- [ ] Capacete: o cabelo some, sem cintilação
- [ ] Parado, correndo, voando e lutando: sem buracos nas juntas do `du_flare_a`
- [ ] "Aleatório" 20 vezes: nunca estilos 7, 8 ou 9

## 6. Futuro e desejos
- [ ] Missão da Bulma / região do Futuro 3 vezes seguidas: sem `stage=arrival` no log
- [ ] Afastar-se durante a espera da cidade: cancela com mensagem própria
- [ ] Invocar o Shenron e clicar nele nos primeiros 10 s: a câmera volta e o menu abre
- [ ] Sem clicar: cena normal. Até 3 desejos, e o dragão some depois do 3º

## 7. Mundo antigo (somente em CÓPIA; o reparo não se desfaz)
- [ ] Chunks gerados e construções intactos
- [ ] Ir ao Futuro: sem `Unhandled promise rejection`; `[Future] city initialization deferred` é esperado
- [ ] Outro Mundo: 1 aviso `snake_path_2_12 … placing it again`, trecho em (−12, 65, −234), sem aviso ao reentrar
- [ ] Kaioshin já visitado: `under repair` / `repaired` no log
- [ ] Construção sob bolha: `kept legacy under a sky bubble` e construção intacta. O bloco citado pode ser o vidro
- [ ] Personagens salvos continuam iguais, exceto os cabelos dos estilos 1, 2 e 3

## 8. Regressão
- [ ] `/dbe:pay` com valor negativo: recusa
- [ ] `/dbe:redeem`: restrito a operador
- [ ] Créditos e falas da Bulma corretos; a marca-d'água com o crédito do DragonMineZ cabe na tela
- [ ] Sair e entrar: dados preservados

## 9. Enviar
- [ ] Este roteiro marcado + Content Log completo + vídeo de Kaioshin
