// Utilitários compartilhados pelas ferramentas de validação (sem dependências npm).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BP = path.join(ROOT, "Dragon Block_bp");
export const RP = path.join(ROOT, "Dragon Block_rp");
export const PACKS = [
  { name: "BP", dir: BP },
  { name: "RP", dir: RP },
];

/** Caminho relativo à raiz do repositório, sempre com "/". */
export function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

/** Lista recursiva de arquivos (caminhos absolutos), em ordem estável. */
export function walk(dir, filter = () => true) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out;
}

/**
 * Remove comentários // e /* *\/ fora de strings e vírgulas finais antes de } ou ].
 * O Bedrock aceita ambos; o JSON.parse do Node não.
 */
export function stripJsonComments(text) {
  let out = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < n && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < n && text[i] !== "\n") i++;
    } else if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      // Mantém as quebras de linha para preservar a numeração nas mensagens de erro.
      const chunk = end === -1 ? text.slice(i) : text.slice(i, end + 2);
      out += chunk.replace(/[^\n]/g, " ");
      i = end === -1 ? n : end + 2;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function stripTrailingCommas(text) {
  let out = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < n && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === ",") {
      let j = i + 1;
      while (j < n && /\s/.test(text[j])) j++;
      if (text[j] === "}" || text[j] === "]") {
        out += " ";
        i++;
        continue;
      }
    }
    out += c;
    i++;
  }
  return out;
}

/** Converte a posição de um SyntaxError do JSON.parse em linha:coluna. */
function locate(text, err) {
  const m = /position (\d+)/.exec(err.message);
  if (!m) return "";
  const pos = Number(m[1]);
  const before = text.slice(0, pos);
  const line = before.split("\n").length;
  const col = pos - before.lastIndexOf("\n");
  return `${line}:${col}`;
}

/**
 * Lê e faz parse de um JSON do Bedrock.
 * Retorna { data, error, warnings } — warnings lista tolerâncias usadas (ex.: vírgula final).
 */
export function readJson(file) {
  let text = fs.readFileSync(file, "utf8");
  const warnings = [];
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const clean = stripJsonComments(text);
  try {
    return { data: JSON.parse(clean), error: null, warnings };
  } catch (err) {
    const relaxed = stripTrailingCommas(clean);
    try {
      const data = JSON.parse(relaxed);
      warnings.push("vírgula sobrando antes de } ou ] (o Bedrock tolera, mas outras ferramentas não)");
      return { data, error: null, warnings };
    } catch {
      const where = locate(clean, err);
      return { data: null, error: `${where ? where + " " : ""}${err.message}`, warnings };
    }
  }
}

// Cache simples para não reler os mesmos JSON entre verificações.
const jsonCache = new Map();
export function cachedJson(file) {
  if (!jsonCache.has(file)) jsonCache.set(file, readJson(file));
  return jsonCache.get(file);
}

/** Todos os .json de um diretório, já lidos ({ file, data }); ignora os que falharam. */
export function loadJsonDir(dir) {
  return walk(dir, (f) => f.endsWith(".json"))
    .map((file) => ({ file, data: cachedJson(file).data }))
    .filter((e) => e.data != null);
}

/** Coletor de problemas com níveis "error" e "warn". */
export class Report {
  constructor(title) {
    this.title = title;
    this.items = [];
  }
  error(category, message) {
    this.items.push({ level: "error", category, message });
  }
  warn(category, message) {
    this.items.push({ level: "warn", category, message });
  }
  get errors() {
    return this.items.filter((i) => i.level === "error").length;
  }
  get warnings() {
    return this.items.filter((i) => i.level === "warn").length;
  }
  print({ errorsOnly = process.argv.includes("--errors-only") } = {}) {
    console.log(`\n=== ${this.title} ===`);
    if (this.summary) console.log(`  (${this.summary})`);
    if (!this.items.length) {
      console.log("  OK — nenhum problema encontrado.");
      return;
    }
    const groups = new Map();
    for (const it of this.items) {
      if (errorsOnly && it.level !== "error") continue;
      const key = `${it.level}\u0000${it.category}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it.message);
    }
    const order = [...groups.keys()].sort((a, b) => (a.startsWith("error") === b.startsWith("error") ? 0 : a.startsWith("error") ? -1 : 1));
    for (const key of order) {
      const [level, category] = key.split("\u0000");
      const msgs = groups.get(key);
      console.log(`\n  [${level === "error" ? "ERRO" : "AVISO"}] ${category} (${msgs.length})`);
      for (const m of msgs) console.log(`    - ${m}`);
    }
    console.log(`\n  Resumo: ${this.errors} erro(s), ${this.warnings} aviso(s).`);
  }
  /** true se a verificação falhou (com --strict, avisos também contam). */
  failed(strict = process.argv.includes("--strict")) {
    return this.errors > 0 || (strict && this.warnings > 0);
  }
  /** Imprime e define código de saída ≠ 0 em caso de falha (quando executado diretamente). */
  finish() {
    this.print();
    process.exitCode = this.failed() ? 1 : 0;
    return this;
  }
}

/** true quando o módulo foi executado diretamente com `node arquivo.mjs`. */
export function isMain(metaUrl) {
  return process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === metaUrl;
}

/**
 * Importa os módulos de Dragon Block_bp/scripts/data/*.js sem alterá-los.
 * Os arquivos usam imports sem extensão ("./variables") e não há package.json com "type": "module",
 * então são copiados para uma pasta temporária como .mjs, com os especificadores relativos corrigidos.
 * Imports de "@minecraft/*" (se surgirem) são trocados por um stub vazio.
 */
export async function loadDataModules() {
  const srcDir = path.join(BP, "scripts", "data");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dbe-data-"));
  fs.writeFileSync(path.join(tmp, "__mc_stub.mjs"), "export default {};\n");
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".js")).sort();
  for (const f of files) {
    let src = fs.readFileSync(path.join(srcDir, f), "utf8");
    src = src.replace(/(\bfrom\s*|\bimport\s*\(?\s*)(["'])([^"']+)\2/g, (all, kw, q, spec) => {
      if (spec.startsWith("@minecraft/")) return `${kw}${q}./__mc_stub.mjs${q}`;
      if (!spec.startsWith(".")) return all;
      const base = spec.replace(/\.(m?js)$/, "");
      return `${kw}${q}${base}.mjs${q}`;
    });
    fs.writeFileSync(path.join(tmp, f.replace(/\.js$/, ".mjs")), src);
  }
  const modules = {};
  const errors = [];
  try {
    for (const f of files) {
      const url = pathToFileURL(path.join(tmp, f.replace(/\.js$/, ".mjs"))).href;
      try {
        modules[f.replace(/\.js$/, "")] = await import(url);
      } catch (err) {
        errors.push({ file: `Dragon Block_bp/scripts/data/${f}`, message: err.message });
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return { modules, errors };
}

/** Lê um arquivo .lang em Map(chave → { value, line }) e lista chaves duplicadas. */
export function readLang(file) {
  const map = new Map();
  const duplicates = [];
  const lines = fs.readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/);
  lines.forEach((raw, idx) => {
    const line = raw.replace(/\s*##.*$/, "");
    if (!line.trim() || line.trimStart().startsWith("#")) return;
    const eq = line.indexOf("=");
    if (eq === -1) return;
    const key = line.slice(0, eq).trim();
    if (map.has(key)) duplicates.push({ key, line: idx + 1, first: map.get(key).line });
    else map.set(key, { value: line.slice(eq + 1), line: idx + 1 });
  });
  return { map, duplicates };
}
