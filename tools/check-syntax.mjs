// Verifica a sintaxe de todos os .js de Dragon Universe_bp/scripts com `node --check`.
// Os scripts do Minecraft são módulos ES. Em `node --check arquivo.js` (sem package.json com
// "type": "module") o Node 22 não reporta erros de arquivos com import/export, então o código
// é enviado pela entrada padrão com --input-type=module.
// Uso: node tools/check-syntax.mjs [arquivo.js ...]   (sem argumentos: todos os .js de scripts/)
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { BP, Report, isMain, rel, walk } from "./lib/common.mjs";

export async function run(only = []) {
  const report = new Report("check-syntax — node --check em scripts/");
  const files = only.length ? only.map((f) => path.resolve(f)) : walk(path.join(BP, "scripts"), (f) => f.endsWith(".js"));
  for (const file of files) {
    const res = spawnSync(process.execPath, ["--check", "--input-type=module"], {
      input: fs.readFileSync(file),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (res.error) {
      report.error("Falha ao executar node --check", `${rel(file)} — ${res.error.message}`);
    } else if (res.status !== 0) {
      // Mantém só a localização, o trecho e a mensagem (sem a pilha interna do Node).
      const lines = res.stderr
        .replace(/\[stdin\]/g, rel(file))
        .split(/\r?\n/)
        .filter((l) => l.trim() && !/^\s+at /.test(l) && !/^Node\.js v/.test(l));
      const msg = lines.map((l) => (l.length > 200 ? `${l.slice(0, 200)}…` : l)).join("\n      ");
      report.error("Erro de sintaxe", msg);
    }
  }
  report.summary = `${files.length} arquivos verificados`;
  return report;
}

if (isMain(import.meta.url)) (await run(process.argv.slice(2))).finish();
