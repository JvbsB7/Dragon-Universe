// Gera dist/Dragon-Universe-<versão>.mcaddon com os dois packs, para instalar com dois cliques.
// A versão vem dos manifests. Suba a versão nos dois manifests antes de distribuir um pacote novo:
// com a mesma versão, o Minecraft mantém o pack antigo que já estiver instalado.
// Uso: node tools/package-addon.mjs   (sem dependências: o .mcaddon é um zip montado aqui com o zlib do Node)
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import zlib from "node:zlib";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const packs = ["Dragon Universe_bp", "Dragon Universe_rp"];
const versionOf = (p) => JSON.parse(fs.readFileSync(path.join(root, p, "manifest.json"), "utf8")).header.version.join(".");
const version = versionOf(packs[0]);
if (version !== versionOf(packs[1])) throw new Error(`versões diferentes nos manifests: BP ${version} × RP ${versionOf(packs[1])}`);

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base));
    else out.push(p);
  }
  return out;
}

const local = [];
const central = [];
let offset = 0;
for (const pack of packs) {
  for (const file of listFiles(path.join(root, pack))) {
    const name = Buffer.from(path.relative(root, file).split(path.sep).join("/"), "utf8");
    const data = fs.readFileSync(file);
    const packed = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4); // versão necessária
    head.writeUInt16LE(0x0800, 6); // nomes em UTF-8
    head.writeUInt16LE(8, 8); // deflate
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(packed.length, 18);
    head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(name.length, 26);
    local.push(head, name, packed);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(packed.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, name);
    offset += head.length + name.length + packed.length;
  }
}
const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
const count = central.length / 2;
end.writeUInt16LE(count, 8);
end.writeUInt16LE(count, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(offset, 16);

const dist = path.join(root, "dist");
fs.mkdirSync(dist, { recursive: true });
const out = path.join(dist, `Dragon-Universe-${version}.mcaddon`);
fs.writeFileSync(out, Buffer.concat([...local, centralBuf, end]));
console.log(`gerado: dist/${path.basename(out)} (${count} arquivos, ${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
