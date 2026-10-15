// Recursos que existem fora dos JSON do repositório e, por isso, são ignorados pelas verificações de referência:
// - recursos do jogo base (vanilla);
// - ids registrados em tempo de execução pelo núcleo (scripts/index.js).
// Acrescente aqui somente itens confirmados.

/** Prefixos de ids de animação, controladores, render controllers e geometrias vanilla. */
export const VANILLA_ID_PREFIXES = [
  "animation.player.",
  "animation.humanoid.",
  "animation.common.",
  "animation.armor.",
  "animation.skeleton.",
  "animation.frog.",
  "controller.animation.player.",
  "controller.animation.humanoid.",
  "controller.animation.persona.",
  "controller.animation.frog.",
  "controller.render.player.",
  "geometry.humanoid",
];

export const VANILLA_IDS = new Set([
  "controller.render.default",
  "controller.render.item_default",
  "geometry.cape",
]);

/** Texturas vanilla (caminho sem extensão). */
export const VANILLA_TEXTURES = new Set([
  "textures/misc/enchanted_item_glint",
  "textures/entity/steve",
  "textures/entity/cape_invisible",
  "textures/particle/particles",
  "textures/particle/campfire_smoke",
  "textures/particle/gust",
]);

/** Categorias de eventos de som do jogo base (primeiro segmento do nome). */
export const VANILLA_SOUND_ROOTS = new Set([
  "ambient", "armor", "beacon", "block", "bottle", "break", "bubble", "bucket", "camera", "cauldron",
  "conduit", "crossbow", "damage", "dig", "elytra", "fall", "fire", "firework", "game", "hit", "item",
  "jump", "land", "leashknot", "liquid", "minecart", "mob", "music", "note", "place", "portal", "raid",
  "random", "record", "step", "tile", "trident", "ui", "use",
]);

export function isVanillaId(id) {
  return VANILLA_IDS.has(id) || VANILLA_ID_PREFIXES.some((p) => id.startsWith(p));
}

/** Arquivos vanilla do BP citados por caminho. */
export const VANILLA_BP_FILES = new Set(["loot_tables/empty.json"]);

/** Dimensões registradas pelo núcleo sem JSON próprio (docs/ARCHITECTURE.md, seção de dimensões). */
export const SCRIPT_DIMENSIONS = new Set([
  "dbe:other_world",
  "dbe:hyperbolic_time_chamber",
  "dbe:future_trunks",
  "dbe:world_martial_arts_tournament",
  ...Array.from({ length: 50 }, (_, i) => `dbe:angel_staff_dimension_${i}`),
]);
