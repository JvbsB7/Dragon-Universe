// Executa todas as verificações e retorna código de saída ≠ 0 se alguma encontrar erro.
// Uso: node tools/validate.mjs [--strict] [--errors-only]
//   --strict       avisos também fazem a validação falhar
//   --errors-only  não lista os avisos (continuam contados no resumo)
import { Report } from "./lib/common.mjs";
import { run as validateJson } from "./validate-json.mjs";
import { run as checkRefs } from "./check-refs.mjs";
import { run as checkData } from "./check-data.mjs";
import { run as checkSyntax } from "./check-syntax.mjs";

const CHECKS = [
  ["validate-json", validateJson],
  ["check-refs", checkRefs],
  ["check-data", checkData],
  ["check-syntax", checkSyntax],
];

const results = [];
for (const [name, fn] of CHECKS) {
  let report;
  try {
    report = await fn();
  } catch (err) {
    report = new Report(name);
    report.error("Falha interna da verificação", err.stack ?? String(err));
  }
  report.print();
  results.push([name, report]);
}

console.log("\n=== Resumo ===");
for (const [name, r] of results) {
  console.log(`  ${r.failed() ? "FALHOU" : "ok    "}  ${name.padEnd(14)} ${String(r.errors).padStart(3)} erro(s)  ${String(r.warnings).padStart(3)} aviso(s)`);
}
const failed = results.some(([, r]) => r.failed());
const total = results.reduce((n, [, r]) => n + r.errors, 0);
console.log(failed ? `\nValidação falhou: ${total} erro(s). Consulte docs/KNOWN_ISSUES.md para os problemas já conhecidos.` : "\nValidação concluída sem erros.");
process.exitCode = failed ? 1 : 0;
