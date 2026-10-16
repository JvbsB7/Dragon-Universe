// Executa uma cópia da pasta scripts/ com o @minecraft/server falso (lib/mc-stub.mjs) e grava a sequência
// de chamadas feitas ao carregar e ao rodar os callbacks registrados. Usado por tools/compare-scripts.mjs.
// Uso: node tools/lib/run-with-stub.mjs <cópia-da-pasta-scripts> <arquivo-de-log>
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const [dirArg, logFile] = process.argv.slice(2);
const dir = path.resolve(dirArg);
const stub = url.pathToFileURL(path.join(path.dirname(url.fileURLToPath(import.meta.url)), "mc-stub.mjs")).href;
const HEX_ONLY = /'((?:\\x[0-9a-fA-F]{2})+)'/g;
const decodeHex = (e) => e.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const ROUNDS = 3;
let counter = 0;

// cada .js vira .mjs com os imports do jogo apontando para o stub
for (const f of fs.readdirSync(dir, { recursive: true })) {
  const p = path.join(dir, f);
  if (!p.endsWith(".js")) continue;
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(HEX_ONLY, (m, e) => JSON.stringify(decodeHex(e))); // escapes \xNN equivalem ao texto puro
  s = s.replace(/import\s*\{([^}]*)\}\s*from\s*["']@minecraft\/server(-ui)?["']\s*;?/g, (m, names, isUi) => {
    const v = `__mc${counter++}`;
    return `import{${isUi ? "ui" : "mc"} as ${v}}from"${stub}";const{${names.replace(/\bas\b/g, ":")}}=${v};`;
  });
  s = s.replace(/import\s*\*\s*as\s*(\w+)\s*from\s*["']@minecraft\/server(-ui)?["']\s*;?/g, (m, n, isUi) => `import{${isUi ? "ui" : "mc"} as ${n}}from"${stub}";`);
  s = s.replace(/import\s*["']@minecraft\/server(-ui)?["']\s*;?/g, "");
  s = s.replace(/(from\s*["']\.[^"']*?)\.js(["'])/g, "$1.mjs$2");
  s = s.replace(/import\s*["'](\.[^"']*?)\.js["']/g, 'import"$1.mjs"');
  s = s.replace(/from\s*["'](\.\/variables)["']/g, 'from"$1.mjs"');
  fs.writeFileSync(p.replace(/\.js$/, ".mjs"), s);
}

const { log, callbacks, mc } = await import(stub);
try {
  await import(url.pathToFileURL(path.join(dir, "index.mjs")).href);
} catch (e) {
  log.push("ERRO ao carregar: " + e.message);
}
let ran = 0;
for (let round = 0; round < ROUNDS; round++) {
  for (const [where, fn] of callbacks.splice(0)) {
    log.push("== callback de " + where);
    try {
      const r = fn(mc.event, mc.event2);
      if (r && typeof r.then === "function") await r.catch((e) => log.push("rejeitado: " + e.message));
    } catch (e) {
      log.push("erro: " + e.message);
    }
    ran++;
  }
}
await new Promise((r) => setTimeout(r, 50));
log.push("callbacks executados: " + ran);
fs.writeFileSync(logFile, log.join("\n") + "\n");
process.exit(0); // intervalos falsos não devem manter o processo vivo
