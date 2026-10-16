// Torna legível o núcleo ofuscado (Dragon Block_bp/scripts/index.js) sem mudar a lógica.
//
// O ofuscador guardou todos os textos numa tabela embaralhada (função `a`) lida por um decodificador
// (função `b`, com vários apelidos como `tk`, `vT`...): `tk(0x1a3)` em vez de "ki". Este script:
//   1. avalia só a tabela e o decodificador, isolados numa VM, para obter cada texto;
//   2. troca cada chamada `apelido(0x...)` pelo texto literal e `obj["nome"]` por `obj.nome`;
//   3. decodifica escapes \xNN, mostra números em decimal e remove a tabela e o decodificador (código morto);
//   4. formata com o Prettier.
// Os nomes de variáveis (sG, i3, hO...) não podem ser recuperados e continuam como estão.
// O script aborta se encontrar algo que não sabe tratar com segurança (ex.: um apelido reutilizado
// como outra variável).
//
// Uso: node tools/deobfuscate-core.mjs <entrada.js> <saída.js>
// Requisito: npm install dentro de tools/ (Prettier, só ferramenta de desenvolvimento).
import fs from "node:fs";
import vm from "node:vm";
import * as prettier from "prettier";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Uso: node tools/deobfuscate-core.mjs <entrada.js> <saída.js>");
  process.exit(2);
}

const raw = fs.readFileSync(input, "utf8");
// as posições do AST valem para o texto devolvido pelo parser (ele pode normalizar o original)
const { ast, text } = await prettier.__debug.parse(raw, { parser: "babel" });
const body = ast.program.body;
const src = (n) => text.slice(n.start, n.end);
const fail = (msg) => {
  console.error("ABORTADO: " + msg);
  process.exit(1);
};

/** Percorre todos os nós; `visit(node, parent, key, ancestors)` pode devolver um nó substituto. */
function walk(node, visit, parent = null, key = null, ancestors = []) {
  if (!node || typeof node.type !== "string") return node;
  const replaced = visit(node, parent, key, ancestors);
  if (replaced) return replaced;
  ancestors.push(node);
  for (const k of Object.keys(node)) {
    if (k === "loc" || k === "extra" || k === "comments" || k === "leadingComments" || k === "trailingComments") continue;
    const v = node[k];
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) if (v[i] && typeof v[i].type === "string") v[i] = walk(v[i], visit, node, k, ancestors);
    } else if (v && typeof v.type === "string") {
      node[k] = walk(v, visit, node, k, ancestors);
    }
  }
  ancestors.pop();
  return node;
}

// ---- 1. tabela, decodificador e a IIFE que gira a tabela
const tableFn = body.find((s) => s.type === "FunctionDeclaration" && s.id?.name === "a");
const decoderFn = body.find((s) => s.type === "FunctionDeclaration" && s.id?.name === "b");
if (!tableFn || !decoderFn) fail("funções a/b não encontradas no topo do arquivo");
const isRotation = (s) =>
  s.type === "ExpressionStatement" &&
  s.expression.type === "CallExpression" &&
  s.expression.arguments.length === 2 &&
  s.expression.arguments[0].type === "Identifier" &&
  s.expression.arguments[0].name === "a";
const rotation = body.find(isRotation);
if (!rotation) fail("IIFE de rotação da tabela não encontrada");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(`${src(tableFn)};${src(decoderFn)};${src(rotation)};this.decode=b;`, ctx, { timeout: 10000 });

// ---- 2. apelidos do decodificador (const tk=b; const vT=tk; ...)
const aliases = new Set(["b"]);
for (let grew = true; grew; ) {
  grew = false;
  walk(ast, (n) => {
    if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && n.init?.type === "Identifier" && aliases.has(n.init.name) && !aliases.has(n.id.name)) {
      aliases.add(n.id.name);
      grew = true;
    }
  });
}

// Um nome de apelido pode ser reaproveitado como outra variável num escopo interno (ex.: `let zq = ...` num patch).
// Isso só é aceito se, dentro desse escopo, o nome nunca for chamado como função: aí nenhuma troca acontece ali.
const FUNCS = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression", "ClassMethod", "ClassPrivateMethod", "ObjectMethod"]);
const BLOCKS = new Set(["Program", "BlockStatement", "StaticBlock", "CatchClause", "ForStatement", "ForInStatement", "ForOfStatement", ...FUNCS]);
const shadows = []; // { name, scope, what }
walk(ast, (n, parent, key, anc) => {
  if (FUNCS.has(n.type)) for (const p of n.params) if (p.type === "Identifier" && aliases.has(p.name)) shadows.push({ name: p.name, scope: n, what: "parâmetro" });
  if (n.type === "CatchClause" && n.param?.type === "Identifier" && aliases.has(n.param.name)) shadows.push({ name: n.param.name, scope: n, what: "catch" });
  if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && aliases.has(n.id.name) && !(n.init?.type === "Identifier" && aliases.has(n.init.name))) {
    const wanted = parent.kind === "var" ? FUNCS : BLOCKS;
    const scope = [...anc].reverse().find((a) => a !== parent && (wanted.has(a.type) || a.type === "Program"));
    shadows.push({ name: n.id.name, scope, what: "variável" });
  }
  if ((n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") && n.id && aliases.has(n.id.name) && n !== decoderFn) fail(`declaração ${n.id.name} com nome de apelido`);
  return undefined;
});
const shadowScopes = new Map(); // nome -> Set(escopos onde o nome é outra variável)
for (const sh of shadows) {
  let calls = 0;
  walk(sh.scope, (n) => {
    if (n.type === "CallExpression" && n.callee.type === "Identifier" && n.callee.name === sh.name) calls++;
    return undefined;
  });
  if (calls) fail(`apelido ${sh.name} reutilizado como ${sh.what} num escopo onde também é chamado`);
  if (!shadowScopes.has(sh.name)) shadowScopes.set(sh.name, new Set());
  shadowScopes.get(sh.name).add(sh.scope);
}
const shadowed = (name, anc) => anc.some((a) => shadowScopes.get(name)?.has(a));
if (shadows.length) console.log(`nomes de apelido reaproveitados com segurança: ${shadows.map((s) => s.name + " (" + s.what + ")").join(", ")}`);

// ---- 3. troca das chamadas e limpeza de notação
const IDENT = /^[A-Za-z_$][\w$]*$/;
const stringNode = (value, like) => ({ type: "StringLiteral", value, start: like.start, end: like.end, loc: like.loc, extra: { rawValue: value, raw: JSON.stringify(value) } });
let decoded = 0;
let unresolved = 0;
walk(ast, (n, parent, key, anc) => {
  if (n.type === "CallExpression" && n.callee.type === "Identifier" && aliases.has(n.callee.name) && !shadowed(n.callee.name, anc)) {
    const arg = n.arguments[0];
    if (n.arguments.length === 1 && arg.type === "NumericLiteral") {
      decoded++;
      return stringNode(ctx.decode(arg.value), n);
    }
    unresolved++;
  }
  return undefined;
});
if (unresolved) fail(`${unresolved} chamada(s) do decodificador com argumento não literal`);

let members = 0;
let keys = 0;
let escapes = 0;
let numbers = 0;
walk(ast, (n) => {
  if ((n.type === "MemberExpression" || n.type === "OptionalMemberExpression") && n.computed && n.property.type === "StringLiteral" && IDENT.test(n.property.value)) {
    n.computed = false;
    n.property = { type: "Identifier", name: n.property.value, start: n.property.start, end: n.property.end, loc: n.property.loc };
    members++;
  } else if (
    (n.type === "ClassMethod" || n.type === "ClassProperty" || n.type === "ObjectMethod" || n.type === "ObjectProperty") &&
    n.computed &&
    n.key.type === "StringLiteral" &&
    IDENT.test(n.key.value)
  ) {
    n.computed = false;
    n.key = { type: "Identifier", name: n.key.value, start: n.key.start, end: n.key.end, loc: n.key.loc };
    keys++;
  } else if (n.type === "StringLiteral" && n.extra?.raw && /\\x[0-9a-fA-F]{2}/.test(n.extra.raw)) {
    n.extra = { rawValue: n.value, raw: JSON.stringify(n.value) };
    escapes++;
  } else if (n.type === "NumericLiteral" && n.extra?.raw && /^0x/i.test(n.extra.raw) && Number.isSafeInteger(n.value)) {
    n.extra = { rawValue: n.value, raw: String(n.value) };
    numbers++;
  }
  return undefined;
});

// ---- 4. remoção do código morto (tabela, decodificador, rotação e declarações dos apelidos)
let leftover = 0;
walk(ast, (n, parent, key, anc) => {
  if (n.type !== "Identifier" || !aliases.has(n.name) || shadowed(n.name, anc)) return undefined;
  const isAliasDecl = parent?.type === "VariableDeclarator" && (key === "id" || key === "init");
  const isDecoderName = parent === decoderFn && key === "id";
  const isPropertyName =
    (key === "property" && (parent.type === "MemberExpression" || parent.type === "OptionalMemberExpression") && !parent.computed) ||
    (key === "key" && !parent.computed);
  if (isPropertyName) return undefined; // ex.: Math.PI, onde "PI" também é nome de um apelido
  const insideDeadCode = anc.some((a) => a === tableFn || a === decoderFn || a === rotation);
  if (!isAliasDecl && !isDecoderName && !insideDeadCode) {
    leftover++;
    if (process.env.DEOB_DEBUG) console.log(`uso restante: ${n.name} em ${parent?.type}.${key} — ${text.slice(Math.max(0, n.start - 60), n.end + 40)}`);
  }
  return undefined;
});
let removedDecls = 0;
if (leftover === 0) {
  ast.program.body = body.filter((s) => s !== tableFn && s !== decoderFn && s !== rotation);
  walk(ast, (n) => {
    for (const k of ["body", "consequent"]) {
      if (!Array.isArray(n[k])) continue;
      n[k] = n[k].filter((s) => {
        if (s.type !== "VariableDeclaration") return true;
        const before = s.declarations.length;
        s.declarations = s.declarations.filter((d) => !(d.id.type === "Identifier" && aliases.has(d.id.name) && d.init?.type === "Identifier" && aliases.has(d.init.name)));
        removedDecls += before - s.declarations.length;
        return s.declarations.length > 0;
      });
    }
    return undefined;
  });
}

// ---- 5. formatação
const out = await prettier.__debug.formatAST(ast, { parser: "babel", originalText: text, printWidth: 120 });
const formatted = typeof out === "string" ? out : out.formatted;
const header =
  "// Núcleo do Dragon Evolution (About04), base do Dragon Universe.\n" +
  "// Gerado por tools/deobfuscate-core.mjs a partir da versão ofuscada (commit 2d4f628): textos decodificados e\n" +
  "// código formatado, sem mudança de lógica. Os nomes curtos de variáveis vêm do ofuscador e não puderam ser recuperados.\n";
fs.writeFileSync(output, header + formatted);

console.log(`apelidos do decodificador: ${aliases.size}`);
console.log(`chamadas decodificadas: ${decoded}`);
console.log(`obj["x"] -> obj.x: ${members}; chaves de classe/objeto: ${keys}; strings com \\x: ${escapes}; números hex: ${numbers}`);
console.log(leftover === 0 ? `código morto removido (tabela, decodificador, rotação, ${removedDecls} apelidos)` : `ATENÇÃO: ${leftover} uso(s) restante(s) dos apelidos; tabela mantida`);
console.log(`saída: ${output} (${formatted.split("\n").length} linhas)`);
