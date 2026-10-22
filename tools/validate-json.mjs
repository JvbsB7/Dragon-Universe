// Valida os JSON dos dois packs: parse (aceitando comentários), extensões, format_version,
// contents.json e dependências entre os manifests.
// Uso: node tools/validate-json.mjs
import fs from "node:fs";
import path from "node:path";
import { BP, RP, PACKS, Report, cachedJson, isMain, rel, walk } from "./lib/common.mjs";

// Extensões aceitas por pasta de primeiro nível. Pastas não listadas aceitam somente .json.
const ALLOWED = {
  BP: {
    scripts: [".js"],
    structures: [".mcstructure"],
    texts: [".lang", ".json"],
  },
  RP: {
    textures: [".png", ".tga", ".jpg", ".jpeg", ".json"],
    sounds: [".ogg", ".wav", ".fsb", ".mp3", ".json"],
    texts: [".lang", ".json"],
    materials: [".material", ".json"],
  },
};
const ROOT_FILES = new Set(["manifest.json", "contents.json", "pack_icon.png", "README.md", "blocks.json", "sounds.json", "biomes_client.json", "splashes.json", "loading_messages.json"]);
const JSON_LIKE = new Set([".json", ".material"]);

function checkParse(report) {
  let count = 0;
  for (const { name, dir } of PACKS) {
    for (const file of walk(dir, (f) => JSON_LIKE.has(path.extname(f).toLowerCase()))) {
      count++;
      const { error, warnings } = cachedJson(file);
      if (error) report.error("JSON inválido", `${rel(file)} — ${error}`);
      for (const w of warnings) report.warn("JSON tolerado pelo jogo", `${rel(file)} — ${w}`);
    }
  }
  return count;
}

/** Arquivos em pastas de definição com extensão que o jogo não carrega. */
function checkExtensions(report) {
  for (const { name, dir } of PACKS) {
    for (const file of walk(dir)) {
      const parts = path.relative(dir, file).split(path.sep);
      const ext = path.extname(file).toLowerCase();
      const base = path.basename(file);
      if (parts.length === 1) {
        if (!ROOT_FILES.has(base)) {
          const why = base.startsWith(".") && !path.extname(base.slice(1)) ? "nome vazio" : "arquivo inesperado na raiz do pack";
          report.warn("Arquivo inesperado", `${rel(file)} — ${why}`);
        }
        continue;
      }
      const allowed = ALLOWED[name][parts[0]] ?? [".json"];
      if (allowed.includes(ext)) continue;
      // Se o conteúdo é JSON de definição, é um arquivo com extensão errada: o jogo ignora.
      let looksLikeDefinition = false;
      try {
        const { data } = cachedJson(file);
        looksLikeDefinition = data && typeof data === "object" && Object.keys(data).some((k) => k.startsWith("minecraft:") || k === "format_version");
      } catch {
        /* binário ou ilegível */
      }
      if (looksLikeDefinition) {
        report.error("Definição com extensão errada (não carrega)", `${rel(file)} — conteúdo é JSON válido; renomear para ${path.basename(file, ext)}.json`);
      } else {
        report.error("Extensão não aceita na pasta", `${rel(file)} — "${parts[0]}/" aceita ${allowed.join(", ")}`);
      }
    }
  }
}

function checkFormatVersions(report) {
  for (const { dir } of PACKS) {
    for (const file of walk(dir, (f) => f.endsWith(".json"))) {
      const { data } = cachedJson(file);
      if (!data || typeof data !== "object" || !("format_version" in data)) continue;
      const fv = data.format_version;
      if (path.basename(file) === "manifest.json") continue;
      if (typeof fv !== "string" || !/^\d+\.\d+(\.\d+)?$/.test(fv)) {
        report.warn("format_version fora do padrão", `${rel(file)} — format_version: ${JSON.stringify(fv)}`);
      }
    }
  }
}

/** menu_category.group sem namespace ("itemGroup.name.stone") faz o jogo recusar o bloco/item inteiro (Bedrock 26.x). */
function checkMenuGroups(report) {
  for (const sub of ["blocks", "items"]) {
    for (const file of walk(path.join(BP, sub), (f) => f.endsWith(".json"))) {
      const { data } = cachedJson(file);
      const def = data?.["minecraft:block"] ?? data?.["minecraft:item"];
      const group = def?.description?.menu_category?.group;
      if (typeof group === "string" && !group.includes(":")) {
        report.error("Grupo de menu sem namespace (definição não carrega)", `${rel(file)} — "${group}" → "minecraft:${group}"`);
      }
    }
  }
}

function checkContents(report) {
  for (const { name, dir } of PACKS) {
    const file = path.join(dir, "contents.json");
    if (!fs.existsSync(file)) continue;
    const { data } = cachedJson(file);
    if (!data?.content) continue;
    const listed = new Set(data.content.map((c) => c.path));
    for (const p of listed) {
      if (!fs.existsSync(path.join(dir, p))) report.error(`contents.json do ${name} lista arquivo inexistente`, `${rel(dir)}/${p}`);
    }
    const missing = walk(dir)
      .map((f) => path.relative(dir, f).split(path.sep).join("/"))
      .filter((p) => p !== "contents.json" && !listed.has(p));
    for (const p of missing) report.warn(`Arquivo ausente do contents.json do ${name}`, `${rel(dir)}/${p}`);
  }
}

function checkManifests(report) {
  const bp = cachedJson(path.join(BP, "manifest.json")).data;
  const rp = cachedJson(path.join(RP, "manifest.json")).data;
  if (!bp || !rp) return;
  const deps = (m) => (m.dependencies ?? []).filter((d) => d.uuid).map((d) => d.uuid);
  if (!deps(bp).includes(rp.header.uuid)) report.error("Manifests", "o BP não declara dependência do RP (header.uuid do RP)");
  if (!deps(rp).includes(bp.header.uuid)) report.warn("Manifests", "o RP não declara dependência do BP");
  const v = (m) => JSON.stringify(m.header.version);
  if (v(bp) !== v(rp)) report.warn("Manifests", `versões diferentes: BP ${v(bp)} × RP ${v(rp)}`);
  const uuids = [bp.header.uuid, ...bp.modules.map((m) => m.uuid), rp.header.uuid, ...rp.modules.map((m) => m.uuid)];
  const dup = uuids.filter((u, i) => uuids.indexOf(u) !== i);
  if (dup.length) report.error("Manifests", `uuid repetido: ${[...new Set(dup)].join(", ")}`);
}

export async function run() {
  const report = new Report("validate-json — JSON, extensões e contents.json");
  const count = checkParse(report);
  checkExtensions(report);
  checkFormatVersions(report);
  checkMenuGroups(report);
  checkContents(report);
  checkManifests(report);
  report.summary = `${count} arquivos JSON lidos`;
  return report;
}

if (isMain(import.meta.url)) (await run()).finish();
