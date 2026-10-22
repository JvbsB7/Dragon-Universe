// Gera o logo "MINECRAFT / DRAGON UNIVERSE": mantém o "MINECRAFT" do logo original e desenha a linha de baixo
// em azul, no mesmo estilo (letras inclinadas, face da frente em degradê, face de cima em 3D e contorno preto).
//
// Uso (a partir da raiz do repositório):
//   git show 23ac6d5:"Dragon Universe_rp/textures/ui/title.png" > logo-original.png
//   node tools/logo/make-logo.mjs logo-original.png "Dragon Universe_rp/textures/ui/title.png"
// Texto, cores (FRONT_*, SIDE_*, HIGHLIGHT) e tamanhos ficam nas constantes abaixo. Sem dependências.
import fs from "node:fs";
import { decode, encode } from "./png.mjs";

const [inp, out] = process.argv.slice(2);
const src = decode(fs.readFileSync(inp));
const W = src.width, H = src.height;

// ---- parâmetros (medidos no logo original)
const TEXT = "DRAGON UNIVERSE";
const TOP = 374;          // topo da face da frente
const HEIGHT = 128;       // altura da face da frente
const ROWS = 5;
const CELL = HEIGHT / ROWS;
const SLANT = 0.5;        // inclinação: cada pixel para baixo desloca 0,5 px para a direita
const DEPTH = 72;         // altura da face de cima (extrusão)
const OUTLINE = 9;        // contorno preto
const GAP = 0.9;          // espaço entre letras, em células
const SPACE = 2.2;        // espaço entre palavras, em células

const FONT = {
  D: ["###.", "#..#", "#..#", "#..#", "###."],
  R: ["###.", "#..#", "###.", "#.#.", "#..#"],
  A: ["####", "#..#", "####", "#..#", "#..#"],
  G: ["####", "#...", "#.##", "#..#", "####"],
  O: ["####", "#..#", "#..#", "#..#", "####"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#"],
  U: ["#..#", "#..#", "#..#", "#..#", "####"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  V: ["#...#", "#...#", "#...#", ".#.#.", "..#.."],
  E: ["####", "#...", "###.", "#...", "####"],
  S: ["####", "#...", "####", "...#", "####"],
};

// largura total para centralizar
let cells = 0;
for (const ch of TEXT) cells += ch === " " ? SPACE : FONT[ch][0].length + GAP;
cells -= GAP;
const textW = cells * CELL + HEIGHT * SLANT;
const X0 = Math.round((W - textW) / 2);

// posição de cada letra (em células)
const glyphs = [];
let cx = 0;
for (const ch of TEXT) {
  if (ch === " ") { cx += SPACE; continue; }
  glyphs.push({ ch, x: cx });
  cx += FONT[ch][0].length + GAP;
}

/** Máscara da face da frente de uma letra: mapeia o pixel de volta para a grade sem inclinação. */
function frontOf(g, x, y) {
  const v = y - TOP;
  if (v < 0 || v >= HEIGHT) return false;
  const u = (x - X0 - v * SLANT) / CELL - g.x;
  const rows = FONT[g.ch];
  if (u < 0 || u >= rows[0].length) return false;
  return rows[Math.floor(v / CELL)][Math.floor(u)] === "#";
}

const N = W * H;
const layer = Buffer.alloc(N * 4);
const put = (i, [r, g, b]) => { layer[i * 4] = r; layer[i * 4 + 1] = g; layer[i * 4 + 2] = b; layer[i * 4 + 3] = 255; };
const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const FRONT_TOP = [24, 74, 214], FRONT_BOTTOM = [64, 190, 255];
const HIGHLIGHT = [170, 236, 255];
const SIDE_TOP = [14, 20, 60], SIDE_BOTTOM = [36, 56, 146];
const offs = [];
for (let dy = -OUTLINE; dy <= OUTLINE; dy++) for (let dx = -OUTLINE; dx <= OUTLINE; dx++) if (dx * dx + dy * dy <= OUTLINE * OUTLINE) offs.push([dx, dy]);

// cada letra é desenhada inteira (contorno, face de cima e face da frente), da esquerda para a direita
for (const g of glyphs) {
  const cols = FONT[g.ch][0].length;
  const xa = Math.floor(X0 + g.x * CELL) - OUTLINE - 2;
  const xb = Math.ceil(X0 + (g.x + cols) * CELL + HEIGHT * SLANT) + OUTLINE + 2;
  const ya = TOP - DEPTH - OUTLINE - 2, yb = TOP + HEIGHT + OUTLINE + 2;
  const bw = xb - xa, bh = yb - ya;
  const F = new Uint8Array(bw * bh), E = new Uint16Array(bw * bh), S = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) F[y * bw + x] = frontOf(g, xa + x, ya + y) ? 1 : 0;
  // face de cima e "sólido": percorre cada coluna inclinada (mesma inclinação das letras), em passos de meio pixel
  // para não pular nenhum pixel. Acima do topo da letra fica a extrusão; entre o topo e a base, o sólido inclui os
  // buracos (que viram preto no contorno).
  const step = 0.5;
  for (let x0 = -bh * SLANT; x0 < bw; x0 += step) {
    const col = [];
    for (let y = 0; y < bh; y++) {
      const x = Math.round(x0 + (ya + y - TOP) * SLANT - (ya - TOP) * SLANT);
      col.push(x >= 0 && x < bw ? x : -1);
    }
    let first = -1, last = -1;
    for (let y = 0; y < bh; y++) if (col[y] >= 0 && F[y * bw + col[y]]) { if (first < 0) first = y; last = y; }
    if (first < 0) continue;
    // só o topo da letra (primeira linha da grade) tem face de cima; bordas internas ficam no buraco preto
    const topRow = ya + first - TOP < CELL;
    for (let d = 1; topRow && d <= DEPTH && first - d >= 0; d++) {
      const x = col[first - d];
      if (x >= 0 && !F[(first - d) * bw + x]) E[(first - d) * bw + x] = Math.max(E[(first - d) * bw + x], d);
    }
    for (let y = Math.max(0, topRow ? first - DEPTH : first); y <= last; y++) if (col[y] >= 0) S[y * bw + col[y]] = 1;
  }
  // contorno preto: dilatação do sólido
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    if (!S[y * bw + x]) continue;
    const inner = x > 0 && x < bw - 1 && y > 0 && y < bh - 1 && S[y * bw + x - 1] && S[y * bw + x + 1] && S[(y - 1) * bw + x] && S[(y + 1) * bw + x];
    if (inner) { put((ya + y) * W + xa + x, [0, 0, 0]); continue; }
    for (const [dx, dy] of offs) {
      const nx = xa + x + dx, ny = ya + y + dy;
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) put(ny * W + nx, [0, 0, 0]);
    }
  }
  // faces
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const i = (ya + y) * W + xa + x;
    if (F[y * bw + x]) {
      const t = (ya + y - TOP) / HEIGHT;
      const edgeTop = y >= 3 && !F[(y - 3) * bw + x];
      put(i, edgeTop ? HIGHLIGHT : lerp(FRONT_TOP, FRONT_BOTTOM, t));
    } else if (E[y * bw + x]) {
      put(i, lerp(SIDE_TOP, SIDE_BOTTOM, 1 - E[y * bw + x] / DEPTH));
    }
  }
}

// camada de cima: o "MINECRAFT" original, sem a faixa vermelha que pertencia à linha de baixo
const CUT = 352;
const outImg = Buffer.alloc(N * 4);
layer.copy(outImg);
for (let y = 0; y < CUT; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4;
  const r = src.data[i], g = src.data[i + 1], b = src.data[i + 2], a = src.data[i + 3];
  if (a < 8) continue;
  if (r > b + 8 && !(Math.abs(r - g) < 14 && Math.abs(g - b) < 14)) {
    if (y >= 290) continue; // faixa da linha antiga: substituída pela extrusão nova
    // acima dela, o sombreado vermelho vira azul com o mesmo brilho
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    src.data[i] = Math.round(lum * 0.35); src.data[i + 1] = Math.round(lum * 0.55); src.data[i + 2] = Math.min(255, Math.round(lum * 1.6 + 20));
  }
  const dark = r < 40 && g < 40 && b < 40;
  // preto do original só onde a linha nova não pintou nada (evita "manchas" do contorno antigo sobre a extrusão)
  if (dark && (y >= 312 || (layer[i + 3] && y > 290))) continue;
  // mistura simples respeitando a transparência do original
  const fa = a / 255;
  for (let c = 0; c < 3; c++) outImg[i + c] = Math.round(src.data[i + c] * fa + outImg[i + c] * (1 - fa) * (outImg[i + 3] / 255));
  outImg[i + 3] = Math.max(a, outImg[i + 3]);
}

fs.writeFileSync(out, encode({ width: W, height: H, data: outImg }));
console.log(`logo gerado: ${W}x${H}, texto ${Math.round(textW)} px a partir de x=${X0}`);
