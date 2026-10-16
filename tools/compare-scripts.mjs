// Compara o comportamento dos scripts de uma revisão do Git com o da pasta atual, sem Minecraft.
//
// Cada versão de Dragon Block_bp/scripts/ é carregada com um @minecraft/server falso; tudo o que ela chama no
// "jogo" (inscrições em eventos, registros, intervalos, consultas...) é registrado, e os callbacks registrados
// também são executados. Se os dois registros forem idênticos, a mudança não alterou o que os scripts fazem nesse
// cenário. Serve para refatorações que não devem mudar a lógica (ex.: renomear variáveis do núcleo). Não substitui
// o teste no jogo: o ambiente falso não reproduz valores reais.
//
// Uso: node tools/compare-scripts.mjs [revisão]   (padrão: HEAD)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const rev = process.argv[2] ?? "HEAD";
const SCRIPTS = "Dragon Block_bp/scripts";
const runner = path.join(root, "tools", "lib", "run-with-stub.mjs");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "du-compare-"));

function extractRevision(target) {
  // lista e copia os arquivos da revisão sem mexer na pasta de trabalho
  const files = execFileSync("git", ["ls-tree", "-r", "--name-only", rev, "--", SCRIPTS], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
  if (!files.length) throw new Error(`nenhum arquivo de ${SCRIPTS} na revisão ${rev}`);
  for (const f of files) {
    const dest = path.join(target, path.relative(SCRIPTS, f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, execFileSync("git", ["show", `${rev}:${f}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 }));
  }
}

// fs.cpSync encerra o processo sem erro em caminhos com acento no Windows (Node 22); cópia manual
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else fs.writeFileSync(b, fs.readFileSync(a));
  }
}

function run(dir, logFile) {
  execFileSync(process.execPath, [runner, dir, logFile], { stdio: ["ignore", "ignore", "inherit"], timeout: 600000 });
  return fs.readFileSync(logFile, "utf8").split("\n");
}

const before = path.join(work, "antes");
const after = path.join(work, "depois");
extractRevision(before);
copyDir(path.join(root, SCRIPTS), after);
const a = run(before, path.join(work, "antes.log"));
const b = run(after, path.join(work, "depois.log"));

console.log(`${rev}: ${a.length} linhas · pasta atual: ${b.length} linhas · ${a.at(-2)} / ${b.at(-2)}`);
const max = Math.max(a.length, b.length);
let diffs = 0;
for (let i = 0; i < max && diffs < 20; i++) {
  if (a[i] !== b[i]) {
    if (!diffs) console.log("Primeiras diferenças (linha: antes | depois):");
    console.log(`  ${i + 1}: ${a[i] ?? "(fim)"}  |  ${b[i] ?? "(fim)"}`);
    diffs++;
  }
}
fs.rmSync(work, { recursive: true, force: true });
if (diffs) {
  console.log("DIFERENTE: o comportamento observado mudou.");
  process.exit(1);
}
console.log("IDÊNTICO: mesmas chamadas ao jogo, na mesma ordem.");
