# Rascunhos fora dos packs

Arquivos de conteúdo inacabado retirados dos packs para não serem carregados pelo jogo. Para ativar um deles, termine-o, mova-o de volta para a pasta correta do pack com a extensão `.json`, inclua-o no `contents.json` e rode `node tools/validate.mjs`.

| Arquivo | Origem | Situação |
|---|---|---|
| `red_tile_slab.block.json` | `Dragon Block_bp/blocks/decor/red_tile_slab.txt` | Laje `dbe:red_tile_slab`. Estava salva como `.txt` e por isso nunca carregou. Falta loot table, receita, item/entrada no inventário e testar a lógica de laje dupla (`dbe:double_bit`). As outras cores de azulejo não têm laje. |
