// Ambiente falso do @minecraft/server e do @minecraft/server-ui, usado por tools/compare-scripts.mjs.
// Qualquer acesso devolve outro proxy; cada chamada é registrada em `log` (caminho + tipos dos argumentos)
// e cada função passada ao "jogo" (eventos, intervalos, map/forEach...) fica em `callbacks` para ser executada depois.
export const log = [];
export const callbacks = [];
const MAX_CALLBACKS = 5000;

/** Texto, número e booleano entram com o valor; objetos com as chaves, para detectar mudanças de parâmetros. */
function describe(a) {
  if (typeof a === "function") return "fn";
  if (typeof a === "string" || typeof a === "number" || typeof a === "boolean") return JSON.stringify(a);
  if (a && typeof a === "object" && !Array.isArray(a)) return "{" + Object.keys(a).join(",") + "}";
  return typeof a;
}

function make(path) {
  const fn = function () {};
  return new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return (hint) => (hint === "number" ? 0 : "");
      if (k === Symbol.iterator) return function* () {};
      if (k === Symbol.hasInstance) return () => false;
      if (typeof k === "symbol") return undefined;
      if (k === "then") return undefined; // não é uma Promise
      if (k === "prototype") return make(path + ".prototype");
      return make(path + "." + k);
    },
    apply(t, self, args) {
      for (const a of args) if (typeof a === "function" && callbacks.length < MAX_CALLBACKS) callbacks.push([path, a]);
      log.push(path + "(" + args.map(describe).join(",") + ")");
      return make(path + "()");
    },
    construct(t, args) {
      log.push("new " + path + "(" + args.length + ")");
      return make("new " + path);
    },
  });
}

export const mc = make("mc");
export const ui = make("ui");
