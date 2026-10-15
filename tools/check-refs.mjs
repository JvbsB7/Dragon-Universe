// Referências cruzadas entre BP, RP e scripts/data:
// entidades BP↔RP, geometrias, texturas, animações, render controllers, ícones (item_texture.json),
// blocos (terrain_texture.json / blocks.json), sons (sound_definitions.json), ids dbe: usados nos dados
// e ids duplicados.
// Uso: node tools/check-refs.mjs
import fs from "node:fs";
import path from "node:path";
import { BP, RP, Report, cachedJson, isMain, loadDataModules, loadJsonDir, rel, walk } from "./lib/common.mjs";
import { SCRIPT_DIMENSIONS, VANILLA_BP_FILES, VANILLA_SOUND_ROOTS, VANILLA_TEXTURES, isVanillaId } from "./lib/allowlist.mjs";

/** Map(id → [arquivos]) com registro de duplicatas. */
class Registry {
  constructor(kind) {
    this.kind = kind;
    this.map = new Map();
  }
  add(id, file) {
    if (typeof id !== "string") return;
    if (!this.map.has(id)) this.map.set(id, []);
    this.map.get(id).push(file);
  }
  has(id) {
    return this.map.has(id);
  }
  duplicates() {
    return [...this.map].filter(([, files]) => files.length > 1);
  }
}

const stripExt = (p) => p.replace(/\.(png|tga|jpe?g|ogg|wav|fsb|mp3)$/i, "");
const fileList = (dir, re) => new Set(walk(dir, (f) => re.test(f)).map((f) => stripExt(path.relative(RP, f).split(path.sep).join("/"))));

/** Percorre um valor JSON chamando fn(valor, chave, caminho) para cada string. */
function eachString(value, fn, key = "", trail = "") {
  if (typeof value === "string") fn(value, key, trail);
  else if (Array.isArray(value)) value.forEach((v, i) => eachString(v, fn, key, `${trail}[${i}]`));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) eachString(v, fn, k, trail ? `${trail}.${k}` : k);
  }
}

// ---------------------------------------------------------------------------------------------
// Coleta de definições
// ---------------------------------------------------------------------------------------------
function collect() {
  const d = {
    entities: new Registry("entidade (BP)"),
    items: new Registry("item"),
    blocks: new Registry("bloco"),
    biomes: new Registry("bioma"),
    dimensions: new Registry("dimensão"),
    features: new Registry("feature"),
    clientEntities: new Registry("entidade (RP)"),
    attachables: new Registry("attachable"),
    geometries: new Registry("geometria"),
    animations: new Registry("animação (RP)"),
    animationControllers: new Registry("animation controller (RP)"),
    renderControllers: new Registry("render controller"),
    properties: new Set(),
    itemReplacesBlock: new Map(),
    spawnEggs: new Set(),
  };

  for (const { file, data } of loadJsonDir(path.join(BP, "entities"))) {
    const desc = data["minecraft:entity"]?.description;
    if (!desc) continue;
    d.entities.add(desc.identifier, rel(file));
    for (const p of Object.keys(desc.properties ?? {})) d.properties.add(p);
    if (desc.is_spawnable) d.spawnEggs.add(`${desc.identifier}_spawn_egg`);
  }
  for (const { file, data } of loadJsonDir(path.join(BP, "items"))) {
    const desc = data["minecraft:item"]?.description;
    if (!desc) continue;
    d.items.add(desc.identifier, rel(file));
    const placer = data["minecraft:item"].components?.["minecraft:block_placer"];
    if (placer?.replace_block_item && placer.block === desc.identifier) d.itemReplacesBlock.set(desc.identifier, true);
  }
  // Somente arquivos .json carregam; um bloco salvo como .txt é tratado como inexistente.
  for (const { file, data } of loadJsonDir(path.join(BP, "blocks"))) {
    const desc = data["minecraft:block"]?.description;
    if (desc) d.blocks.add(desc.identifier, rel(file));
  }
  for (const { file, data } of loadJsonDir(path.join(BP, "biomes"))) {
    d.biomes.add(data["minecraft:biome"]?.description?.identifier, rel(file));
  }
  for (const { file, data } of loadJsonDir(path.join(BP, "dimensions"))) {
    d.dimensions.add(data["minecraft:dimension"]?.description?.identifier, rel(file));
  }
  for (const id of SCRIPT_DIMENSIONS) d.dimensions.add(id, "(registrada pelo núcleo)");
  for (const { file, data } of loadJsonDir(path.join(BP, "features"))) {
    for (const [k, v] of Object.entries(data)) if (k.startsWith("minecraft:")) d.features.add(v?.description?.identifier, rel(file));
  }

  for (const { file, data } of loadJsonDir(path.join(RP, "entity"))) {
    d.clientEntities.add(data["minecraft:client_entity"]?.description?.identifier, rel(file));
  }
  for (const { file, data } of loadJsonDir(path.join(RP, "attachables"))) {
    d.attachables.add(data["minecraft:attachable"]?.description?.identifier, rel(file));
  }
  for (const { file, data } of loadJsonDir(path.join(RP, "models"))) {
    if (Array.isArray(data["minecraft:geometry"])) {
      for (const g of data["minecraft:geometry"]) d.geometries.add(g?.description?.identifier, rel(file));
    } else {
      // Formato 1.8: "geometry.nome" ou "geometry.nome:geometry.pai".
      for (const k of Object.keys(data)) if (k.startsWith("geometry.")) d.geometries.add(k.split(":")[0], rel(file));
    }
  }
  for (const { file, data } of loadJsonDir(path.join(RP, "animations"))) {
    for (const k of Object.keys(data.animations ?? {})) d.animations.add(k, rel(file));
  }
  for (const { file, data } of loadJsonDir(path.join(RP, "animation_controllers"))) {
    for (const k of Object.keys(data.animation_controllers ?? {})) d.animationControllers.add(k, rel(file));
  }
  for (const { file, data } of loadJsonDir(path.join(RP, "render_controllers"))) {
    for (const k of Object.keys(data.render_controllers ?? {})) d.renderControllers.add(k, rel(file));
  }

  d.textureFiles = fileList(path.join(RP, "textures"), /\.(png|tga|jpe?g)$/i);
  d.soundFiles = fileList(path.join(RP, "sounds"), /\.(ogg|wav|fsb|mp3)$/i);
  d.itemTexture = cachedJson(path.join(RP, "textures", "item_texture.json")).data?.texture_data ?? {};
  d.terrainTexture = cachedJson(path.join(RP, "textures", "terrain_texture.json")).data?.texture_data ?? {};
  d.blocksJson = cachedJson(path.join(RP, "blocks.json")).data ?? {};
  d.sounds = cachedJson(path.join(RP, "sounds", "sound_definitions.json")).data?.sound_definitions ?? {};
  d.soundPrefixes = new Set(Object.keys(d.sounds).map((k) => k.split(".").slice(0, 2).join(".")));
  return d;
}

// ---------------------------------------------------------------------------------------------
// Verificações
// ---------------------------------------------------------------------------------------------
function textureExists(d, p) {
  const clean = stripExt(p);
  return d.textureFiles.has(clean) || VANILLA_TEXTURES.has(clean);
}

/** Retorna null se o evento de som é válido; senão "error" ou "warn". */
function soundStatus(d, name) {
  if (!name || d.sounds[name]) return null;
  const root = name.split(".")[0];
  if (!VANILLA_SOUND_ROOTS.has(root)) return "error";
  // Categoria vanilla, mas no mesmo grupo de sons próprios do pack (ex.: "mob.cell.x"): provável erro.
  return d.soundPrefixes.has(name.split(".").slice(0, 2).join(".")) ? "warn" : null;
}

function reportSound(report, d, name, where) {
  const status = soundStatus(d, name);
  if (status === "error") report.error("Som não definido em sound_definitions.json", `"${name}" — ${where}`);
  else if (status === "warn") report.warn("Som não definido no pack (confirme se existe no vanilla)", `"${name}" — ${where}`);
}

function checkDuplicates(report, d) {
  for (const reg of [d.entities, d.items, d.blocks, d.biomes, d.dimensions, d.features, d.clientEntities, d.attachables, d.geometries, d.animations, d.animationControllers, d.renderControllers]) {
    for (const [id, files] of reg.duplicates()) report.error(`Id duplicado: ${reg.kind}`, `${id} — ${files.join(", ")}`);
  }
  for (const [id, files] of d.items.map) {
    if (d.blocks.has(id) && !d.itemReplacesBlock.get(id)) {
      report.error("Item e bloco com o mesmo id sem block_placer.replace_block_item", `${id} — item ${files.join(", ")}; bloco ${d.blocks.map.get(id).join(", ")}`);
    }
  }
}

function checkEntities(report, d) {
  for (const [id, files] of d.entities.map) {
    if (!d.clientEntities.has(id)) report.warn("Entidade do BP sem client_entity no RP (fica invisível)", `${id} — ${files[0]}`);
  }
  for (const [id, files] of d.clientEntities.map) {
    if (!id.startsWith("minecraft:") && !d.entities.has(id)) report.error("client_entity do RP sem entidade no BP", `${id} — ${files[0]}`);
  }
  for (const [id, files] of d.attachables.map) {
    if (!id.startsWith("minecraft:") && !d.items.has(id)) report.warn("Attachable sem item no BP", `${id} — ${files[0]}`);
  }
}

/** Geometrias, texturas, animações, render controllers e sons de client entities e attachables. */
function checkClientDescriptions(report, d) {
  const dirs = [
    ["entity", "minecraft:client_entity"],
    ["attachables", "minecraft:attachable"],
  ];
  for (const [dir, root] of dirs) {
    for (const { file, data } of loadJsonDir(path.join(RP, dir))) {
      const desc = data[root]?.description;
      if (!desc) continue;
      const where = `${desc.identifier} (${rel(file)})`;
      for (const [alias, g] of Object.entries(desc.geometry ?? {})) {
        if (!d.geometries.has(g) && !isVanillaId(g)) report.error("Geometria inexistente", `${g} (geometry.${alias}) — ${where}`);
      }
      for (const [alias, t] of Object.entries(desc.textures ?? {})) {
        if (!textureExists(d, t)) report.error("Textura inexistente", `${t} (textures.${alias}) — ${where}`);
      }
      const anims = desc.animations ?? {};
      for (const [alias, a] of Object.entries(anims)) {
        const ok = d.animations.has(a) || d.animationControllers.has(a) || isVanillaId(a);
        if (!ok) report.error("Animação ou animation controller inexistente", `${a} (animations.${alias}) — ${where}`);
      }
      const animate = desc.scripts?.animate ?? [];
      for (const entry of animate) {
        const name = typeof entry === "string" ? entry : Object.keys(entry)[0];
        if (!(name in anims)) report.error("scripts.animate usa nome que não está em animations", `${name} — ${where}`);
      }
      for (const rc of desc.render_controllers ?? []) {
        const name = typeof rc === "string" ? rc : Object.keys(rc)[0];
        if (!d.renderControllers.has(name) && !isVanillaId(name)) report.error("Render controller inexistente", `${name} — ${where}`);
      }
      for (const [alias, s] of Object.entries(desc.sound_effects ?? {})) reportSound(report, d, s, `sound_effects.${alias} em ${where}`);
    }
  }
}

/** Qualquer string "textures/..." em JSON do RP (UI, partículas, flipbooks etc.) precisa existir. */
function checkTexturePaths(report, d) {
  const skip = new Set(["contents.json"]);
  for (const file of walk(RP, (f) => f.endsWith(".json"))) {
    const relative = path.relative(RP, file).split(path.sep).join("/");
    if (skip.has(relative) || relative.startsWith("entity/") || relative.startsWith("attachables/")) continue;
    const { data } = cachedJson(file);
    const seen = new Set();
    eachString(data, (s) => {
      if (!s.startsWith("textures/") || seen.has(s)) return;
      seen.add(s);
      if (!textureExists(d, s)) report.error("Textura inexistente", `${s} — ${rel(file)}`);
    });
  }
}

function textureEntries(value) {
  // "textures" pode ser string, lista de strings, { path } ou lista com { path } / { variations }.
  const out = [];
  const visit = (v) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") {
      if (v.path) out.push(v.path);
      if (v.variations) v.variations.forEach(visit);
    }
  };
  visit(value);
  return out;
}

function checkItemIcons(report, d) {
  for (const { file, data } of loadJsonDir(path.join(BP, "items"))) {
    const item = data["minecraft:item"];
    const icon = item?.components?.["minecraft:icon"];
    // Itens vanilla sobrescritos usam o atlas do jogo base.
    if (icon == null || item.description.identifier.startsWith("minecraft:")) continue;
    const keys = typeof icon === "string" ? [icon] : icon.textures ? Object.values(icon.textures) : icon.texture ? [icon.texture] : [];
    for (const k of keys) {
      if (!(k in d.itemTexture)) report.error("Ícone de item ausente em item_texture.json", `"${k}" — ${item.description.identifier} (${rel(file)})`);
    }
  }
}

function checkBlocks(report, d) {
  for (const { file, data } of loadJsonDir(path.join(BP, "blocks"))) {
    const block = data["minecraft:block"];
    if (!block) continue;
    const id = block.description.identifier;
    const all = [block.components ?? {}, ...(block.permutations ?? []).map((p) => p.components ?? {})];
    let hasMaterials = false;
    for (const comps of all) {
      const mi = comps["minecraft:material_instances"];
      if (mi) {
        hasMaterials = true;
        for (const [face, inst] of Object.entries(mi)) {
          const tex = typeof inst === "object" ? inst?.texture : null;
          if (tex && !(tex in d.terrainTexture)) report.error("Textura de bloco ausente em terrain_texture.json", `"${tex}" (${face}) — ${id} (${rel(file)})`);
        }
      }
      const geo = comps["minecraft:geometry"];
      const gid = typeof geo === "string" ? geo : geo?.identifier;
      if (gid && !gid.startsWith("minecraft:") && !d.geometries.has(gid)) report.error("Geometria de bloco inexistente", `${gid} — ${id} (${rel(file)})`);
    }
    if (!hasMaterials && !d.blocksJson[id]) report.warn("Bloco sem material_instances e sem entrada em blocks.json", `${id} — ${rel(file)}`);
  }
  for (const [id, entry] of Object.entries(d.blocksJson)) {
    if (id === "format_version") continue;
    if (id.startsWith("dbe:") && !d.blocks.has(id)) report.error("blocks.json referencia bloco inexistente no BP", id);
    const tex = entry?.textures;
    const keys = typeof tex === "string" ? [tex] : tex && typeof tex === "object" ? Object.values(tex) : [];
    for (const k of keys) if (!(k in d.terrainTexture)) report.error("blocks.json usa textura ausente em terrain_texture.json", `"${k}" — ${id}`);
  }
}

function checkTextureAtlases(report, d) {
  for (const [atlas, data] of [
    ["item_texture.json", d.itemTexture],
    ["terrain_texture.json", d.terrainTexture],
  ]) {
    for (const [key, entry] of Object.entries(data)) {
      for (const t of textureEntries(entry?.textures)) {
        if (!textureExists(d, t)) report.error(`Arquivo de textura inexistente (${atlas})`, `${key} → ${t}`);
      }
    }
  }
}

function checkSounds(report, d) {
  const used = new Set();
  for (const [event, def] of Object.entries(d.sounds)) {
    for (const s of def?.sounds ?? []) {
      const name = typeof s === "string" ? s : s?.name;
      if (!name) continue;
      used.add(stripExt(name));
      if (!d.soundFiles.has(stripExt(name))) report.error("Arquivo de som inexistente", `${name} — evento ${event}`);
    }
  }
  for (const f of d.soundFiles) if (!used.has(f)) report.warn("Arquivo de som não usado em sound_definitions.json", `Dragon Block_rp/${f}`);

  // Eventos usados em sounds.json.
  const sj = cachedJson(path.join(RP, "sounds.json")).data ?? {};
  eachString(sj, (s, key, trail) => {
    if (key === "key" || !s) return;
    reportSound(report, d, s, `sounds.json (${trail})`);
  });
  // Comandos /playsound no BP (animation controllers, funções etc.).
  for (const file of walk(BP, (f) => f.endsWith(".json"))) {
    eachString(cachedJson(file).data, (s) => {
      for (const m of s.matchAll(/playsound\s+([\w.]+)/g)) reportSound(report, d, m[1], rel(file));
    });
  }
}

/** Arquivos citados por caminho no BP (loot tables, trading) e ids citados em recipes/loot tables. */
function checkBpReferences(report, d) {
  const isItem = (id) => d.items.has(id) || d.blocks.has(id) || d.spawnEggs.has(id);
  for (const file of walk(BP, (f) => f.endsWith(".json"))) {
    const relative = path.relative(BP, file).split(path.sep).join("/");
    const top = relative.split("/")[0];
    const { data } = cachedJson(file);
    eachString(data, (s, key) => {
      if (/^(loot_tables|trading)\/.+\.json$/.test(s) && !VANILLA_BP_FILES.has(s) && !fs.existsSync(path.join(BP, s))) {
        report.error("Arquivo referenciado inexistente", `${s} — ${rel(file)}`);
      }
      if (["recipes", "loot_tables", "trading"].includes(top) && /^dbe:[a-z0-9_]+$/.test(s) && key !== "identifier" && !isItem(s)) {
        report.error("Item inexistente em recipe/loot table/trading", `${s} — ${rel(file)}`);
      }
    });
  }
  for (const { file, data } of loadJsonDir(path.join(BP, "spawn_rules"))) {
    const id = data["minecraft:spawn_rules"]?.description?.identifier;
    if (id?.startsWith("dbe:") && !d.entities.has(id)) report.error("spawn_rules de entidade inexistente", `${id} — ${rel(file)}`);
  }
  for (const { file, data } of loadJsonDir(path.join(BP, "feature_rules"))) {
    const f = data["minecraft:feature_rules"]?.description?.places_feature;
    if (f?.startsWith("dbe:") && !d.features.has(f)) report.error("feature_rules aponta feature inexistente", `${f} — ${rel(file)}`);
  }
}

// Chaves dos dados que indicam o tipo de id esperado.
const ENTITY_KEYS = new Set(["entity", "npcId", "mentorId", "deliverToNpc", "sourceId", "availableTrainers", "availableIn", "masterId"]);
const ITEM_KEYS = new Set(["item"]);

async function checkDataIds(report, d) {
  const { modules, errors } = await loadDataModules();
  for (const e of errors) report.error("Falha ao importar módulo de dados", `${e.file} — ${e.message}`);
  d.dataIds = new Set();
  const any = (id) =>
    d.entities.has(id) || d.items.has(id) || d.blocks.has(id) || d.biomes.has(id) || d.dimensions.has(id) || d.features.has(id) || d.properties.has(id) || d.spawnEggs.has(id);
  const isItem = (id) => d.items.has(id) || d.blocks.has(id) || d.spawnEggs.has(id);

  for (const [mod, exports] of Object.entries(modules)) {
    for (const [exp, value] of Object.entries(exports)) {
      const seen = new Set();
      const walkData = (v, key, trail, parent) => {
        if (typeof v === "string") {
          const where = `scripts/data/${mod}.js → ${exp}${trail}`;
          if (/^dbe:[a-z0-9_/]+$/.test(v)) {
            const sig = `${v}|${key}`;
            if (seen.has(sig)) return;
            seen.add(sig);
            d.dataIds.add(v);
            let ok;
            let kind;
            if (ENTITY_KEYS.has(key) || (key === "id" && (exp === "entity_data" || exp === "masters_data"))) [ok, kind] = [d.entities.has(v), "entidade"];
            else if (ITEM_KEYS.has(key) || (key === "name" && parent?.type === "item")) [ok, kind] = [isItem(v), "item"];
            else if (key === "blockId") [ok, kind] = [d.blocks.has(v), "bloco"];
            else if (key === "biomeId" || (key === "value" && parent?.test === "in_biome")) [ok, kind] = [d.biomes.has(v), "bioma"];
            else if (key === "dimensionId") [ok, kind] = [d.dimensions.has(v), "dimensão"];
            else if (key === "propertyId") [ok, kind] = [d.properties.has(v), "propriedade de entidade"];
            else [ok, kind] = [any(v), "qualquer definição"];
            if (!ok) report.error(`Id dbe: usado nos dados sem definição JSON (${kind})`, `${v} — ${where}`);
          } else if (v.startsWith("textures/")) {
            if (!textureExists(d, v)) report.error("Textura inexistente (dados)", `${v} — ${where}`);
          } else if (/sound/i.test(key) && /^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(v)) {
            reportSound(report, d, v, where);
          }
        } else if (Array.isArray(v)) v.forEach((x, i) => walkData(x, key, `${trail}[${i}]`, parent));
        else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walkData(x, k, `${trail}.${k}`, v);
      };
      walkData(value, "", "", null);
    }
  }
}

export async function run() {
  const report = new Report("check-refs — referências cruzadas");
  const d = collect();
  checkDuplicates(report, d);
  checkEntities(report, d);
  checkClientDescriptions(report, d);
  checkTexturePaths(report, d);
  checkItemIcons(report, d);
  checkBlocks(report, d);
  checkTextureAtlases(report, d);
  checkSounds(report, d);
  checkBpReferences(report, d);
  await checkDataIds(report, d);
  report.summary = `${d.entities.map.size} entidades BP, ${d.clientEntities.map.size} client entities, ${d.items.map.size} itens, ${d.blocks.map.size} blocos, ${d.geometries.map.size} geometrias, ${Object.keys(d.sounds).length} eventos de som, ${d.dataIds.size} ids dbe: nos dados`;
  return report;
}

if (isMain(import.meta.url)) (await run()).finish();
