// Tournament of Power - dimensao customizada + carregamento por proximidade.
// Requer: Beta APIs ligado no mundo (a API de dimensoes customizadas e experimental).
import { world, system, Player, CustomCommandStatus, CommandPermissionLevel } from "@minecraft/server";

const DIM_ID = "tournament:arena";
const SPAWN = { x: 0.5, y: 87, z: 0.5 };   // piso do mapa fica em Y=86
const LOAD_RADIUS = 96;                    // blocos (so XZ) ao redor do jogador
const CYCLE_TICKS = 10;                    // 1 pedaco no maximo a cada 0,5 s
const PROP = "tournament:placed";

// Se o mapa ja foi colocado antes desta versao, estes pedacos (alterados: sem esmeralda/diamante
// do maze e sem a escada central) sao recolocados uma unica vez.
const PATCH_PROP = "tournament:patch";
const PATCH_VERSION = 2;
const PATCHED_TILES = ["tournament:tp_xn2_y1_zn2", "tournament:tp_x0_yn1_z0", "tournament:tp_x0_y0_z0"];

// Protecao da arena (so vale dentro da dimensao tournament:arena)
const BLOQUEAR_MOBS = true;        // nenhum mob nasce/existe na arena
const PROTEGER_BLOCOS = true;      // nada e destruido (explosoes, quebrar blocos)

// [nome da estrutura, x, y, z (canto minimo), tamanho x, y, z]
const TILES = [["tp_xn3_y1_zn2", -136, 99, -79, 8, 18, 15], ["tp_xn3_y1_zn1", -151, 87, -64, 23, 30, 64], ["tp_xn3_y1_z0", -152, 87, 0, 24, 30, 64], ["tp_xn3_y1_z1", -143, 99, 64, 15, 18, 30], ["tp_xn2_y0_zn2", -92, 48, -90, 28, 16, 26], ["tp_xn2_y0_zn1", -117, 21, -64, 53, 43, 64], ["tp_xn2_y0_z0", -117, 21, 0, 53, 43, 64], ["tp_xn2_y0_z1", -102, 35, 64, 38, 29, 41], ["tp_xn2_y1_zn3", -74, 99, -132, 10, 18, 4], ["tp_xn2_y1_zn2", -128, 64, -128, 64, 53, 64], ["tp_xn2_y1_zn1", -128, 64, -64, 64, 53, 64], ["tp_xn2_y1_z0", -128, 64, 0, 64, 53, 64], ["tp_xn2_y1_z1", -128, 64, 64, 64, 53, 64], ["tp_xn2_y1_z2", -100, 99, 128, 36, 18, 22], ["tp_xn1_yn1_zn1", -33, -21, -28, 33, 21, 28], ["tp_xn1_yn1_z0", -34, -55, 0, 34, 55, 43], ["tp_xn1_y0_zn2", -64, 22, -110, 64, 42, 46], ["tp_xn1_y0_zn1", -64, 0, -64, 64, 50, 64], ["tp_xn1_y0_z0", -64, 0, 0, 64, 50, 64], ["tp_xn1_y0_z1", -64, 13, 64, 64, 51, 61], ["tp_xn1_y1_zn3", -64, 99, -147, 64, 19, 19], ["tp_xn1_y1_zn2", -64, 64, -128, 64, 54, 64], ["tp_xn1_y1_zn1", -64, 86, -64, 64, 42, 64], ["tp_xn1_y1_z0", -64, 86, 0, 64, 42, 64], ["tp_xn1_y1_z1", -64, 64, 64, 64, 51, 64], ["tp_xn1_y1_z2", -64, 66, 128, 64, 51, 35], ["tp_xn1_y2_zn1", -13, 128, -8, 13, 64, 8], ["tp_xn1_y2_z0", -13, 128, 0, 13, 64, 25], ["tp_xn1_y3_zn1", -12, 192, -6, 12, 6, 6], ["tp_xn1_y3_z0", -13, 192, 0, 13, 6, 21], ["tp_x0_yn1_zn1", 0, -22, -28, 38, 22, 28], ["tp_x0_yn1_z0", 0, -63, 0, 40, 63, 43], ["tp_x0_y0_zn2", 0, 22, -110, 64, 42, 46], ["tp_x0_y0_zn1", 0, 0, -64, 64, 50, 64], ["tp_x0_y0_z0", 0, 0, 0, 64, 50, 64], ["tp_x0_y0_z1", 0, 13, 64, 64, 51, 61], ["tp_x0_y1_zn3", 0, 99, -147, 11, 19, 19], ["tp_x0_y1_zn2", 0, 64, -128, 64, 54, 64], ["tp_x0_y1_zn1", 0, 86, -64, 64, 42, 64], ["tp_x0_y1_z0", 0, 86, 0, 64, 42, 64], ["tp_x0_y1_z1", 0, 64, 64, 64, 34, 64], ["tp_x0_y1_z2", 0, 66, 128, 45, 51, 35], ["tp_x0_y2_zn1", 0, 128, -8, 18, 64, 8], ["tp_x0_y2_z0", 0, 128, 0, 18, 64, 25], ["tp_x0_y3_zn1", 0, 192, -6, 17, 6, 6], ["tp_x0_y3_z0", 0, 192, 0, 17, 6, 21], ["tp_x1_y0_zn2", 64, 45, -93, 33, 19, 29], ["tp_x1_y0_zn1", 64, 13, -64, 58, 51, 64], ["tp_x1_y0_z0", 64, 13, 0, 58, 51, 64], ["tp_x1_y0_z1", 64, 35, 64, 43, 29, 44], ["tp_x1_y1_zn2", 64, 64, -112, 54, 34, 48], ["tp_x1_y1_zn1", 64, 64, -64, 64, 34, 64], ["tp_x1_y1_z0", 64, 64, 0, 64, 34, 64], ["tp_x1_y1_z1", 64, 64, 64, 59, 34, 58], ["tp_x2_yn1_z2", 156, -63, 160, 1, 1, 1], ["tp_x2_y1_zn1", 128, 77, -41, 64, 51, 41], ["tp_x2_y1_z0", 128, 77, 0, 64, 51, 52], ["tp_x2_y2_zn1", 147, 128, -18, 45, 44, 18], ["tp_x2_y2_z0", 142, 128, 0, 50, 44, 42], ["tp_x3_y1_zn1", 192, 107, -16, 15, 21, 16], ["tp_x3_y1_z0", 192, 107, 0, 15, 21, 42], ["tp_x3_y2_zn1", 192, 128, -16, 15, 44, 16], ["tp_x3_y2_z0", 192, 128, 0, 15, 44, 42]].map(([name, ox, oy, oz, sx, sy, sz]) => ({ name: "tournament:" + name, ox, oy, oz, sx, sy, sz }));

let placed = new Set();
const fails = new Map();

system.beforeEvents.startup.subscribe((event) => {
  event.dimensionRegistry.registerCustomDimension(DIM_ID);

  const reg = (name, description, fn) =>
    event.customCommandRegistry.registerCommand(
      { name, description, permissionLevel: CommandPermissionLevel.Any, cheatsRequired: false },
      (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) {
          return { status: CustomCommandStatus.Failure, message: "Use como jogador." };
        }
        system.run(() => fn(player));
        return { status: CustomCommandStatus.Success };
      }
    );

  reg("tournament:entrar", "Vai para a dimensao Tournament of Power", enter);
  reg("tournament:sair", "Volta para o Overworld", leave);
});

function loadPlaced() {
  try {
    const s = world.getDynamicProperty(PROP);
    placed = new Set(typeof s === "string" ? JSON.parse(s) : []);
  } catch (e) {
    placed = new Set();
  }
}
function migratePatch() {
  let v;
  try { v = world.getDynamicProperty(PATCH_PROP); } catch (e) {}
  if (v === PATCH_VERSION) return;
  for (const n of PATCHED_TILES) placed.delete(n);
  savePlaced();
  try { world.setDynamicProperty(PATCH_PROP, PATCH_VERSION); } catch (e) {}
}
function savePlaced() {
  try { world.setDynamicProperty(PROP, JSON.stringify([...placed])); } catch (e) {}
}

function distXZ(x, z, t) {
  const dx = Math.max(t.ox - x, 0, x - (t.ox + t.sx));
  const dz = Math.max(t.oz - z, 0, z - (t.oz + t.sz));
  return Math.hypot(dx, dz);
}

function tryPlace(dim, t) {
  try {
    world.structureManager.place(t.name, dim, { x: t.ox, y: t.oy, z: t.oz });
    placed.add(t.name);
    savePlaced();
    return true;
  } catch (e) {
    // normalmente: chunk ainda nao carregado. Tenta de novo no proximo ciclo.
    fails.set(t.name, (fails.get(t.name) ?? 0) + 1);
    return false;
  }
}

// Coloca no maximo 1 pedaco por ciclo, sempre o mais proximo de algum jogador.
system.runInterval(() => {
  if (placed.size >= TILES.length) return;
  const dim = world.getDimension(DIM_ID);
  const players = world.getAllPlayers().filter((p) => p.dimension.id === DIM_ID);
  if (players.length === 0) return;

  const cand = [];
  for (const t of TILES) {
    if (placed.has(t.name) || (fails.get(t.name) ?? 0) > 200) continue;
    let best = Infinity;
    for (const p of players) best = Math.min(best, distXZ(p.location.x, p.location.z, t));
    if (best <= LOAD_RADIUS) cand.push({ t, d: best });
  }
  cand.sort((a, b) => a.d - b.d);
  for (const c of cand.slice(0, 3)) {
    if (tryPlace(dim, c.t)) break;
  }
}, CYCLE_TICKS);

async function enter(player) {
  const dim = world.getDimension(DIM_ID);
  const areaId = "tournament:spawn_area";
  try { world.tickingAreaManager.removeTickingArea(areaId); } catch (e) {}
  player.sendMessage("§eCarregando a arena...");
  try {
    await world.tickingAreaManager.createTickingArea(areaId, {
      dimension: dim,
      from: { x: SPAWN.x - 24, y: SPAWN.y - 8, z: SPAWN.z - 24 },
      to: { x: SPAWN.x + 24, y: SPAWN.y + 16, z: SPAWN.z + 24 },
    });
  } catch (e) {
    player.sendMessage("§cNao consegui carregar a area de spawn: " + e);
    return;
  }
  for (const t of TILES) {
    if (!placed.has(t.name) && distXZ(SPAWN.x, SPAWN.z, t) <= 40) tryPlace(dim, t);
  }
  player.teleport(SPAWN, { dimension: dim });
  try { world.tickingAreaManager.removeTickingArea(areaId); } catch (e) {}
  player.sendMessage("§aBem-vindo! O resto do mapa carrega conforme voce se aproxima.");
}

async function leave(player) {
  const over = world.getDimension("minecraft:overworld");
  const areaId = "tournament:leave_area";
  let x, y, z;
  let fromBed = false;
  try {
    const sp = player.getSpawnPoint();
    if (sp && sp.dimension && sp.dimension.id === "minecraft:overworld") {
      x = sp.x; y = sp.y; z = sp.z; fromBed = true;
    }
  } catch (e) {}
  if (x === undefined) {
    try { const d = world.getDefaultSpawnLocation(); x = d.x; y = d.y; z = d.z; } catch (e) {}
  }
  if (x === undefined) { x = 0; z = 0; }
  x = Math.floor(x); z = Math.floor(z);

  player.sendMessage("§eVoltando ao Overworld...");
  // O chunk do Overworld precisa estar carregado, senao o teleporte falha.
  try { world.tickingAreaManager.removeTickingArea(areaId); } catch (e) {}
  try {
    await world.tickingAreaManager.createTickingArea(areaId, {
      dimension: over,
      from: { x: x - 8, y: 64, z: z - 8 },
      to: { x: x + 8, y: 64, z: z + 8 },
    });
  } catch (e) {
    player.sendMessage("§cNao consegui carregar o Overworld: " + e);
    return;
  }

  if (!fromBed) {
    // spawn do mundo costuma ter Y invalido (ex.: 32767): acha a superficie de verdade
    let top;
    try { top = over.getTopmostBlock({ x, z }); } catch (e) {}
    y = top ? top.location.y + 1 : (Number.isFinite(y) && y > -64 && y < 320 ? y : 100);
  }

  try {
    player.teleport({ x: x + 0.5, y, z: z + 0.5 }, { dimension: over });
    player.sendMessage("§aVoce voltou ao Overworld.");
  } catch (e) {
    player.sendMessage("§cNao consegui voltar: " + e);
  }
  system.runTimeout(() => {
    try { world.tickingAreaManager.removeTickingArea(areaId); } catch (e) {}
  }, 60);
}

// ---- Protecao da arena ----
if (BLOQUEAR_MOBS) {
  const isMob = (e) => {
    try { return e.typeId !== "minecraft:player" && e.matches({ families: ["mob"] }); } catch (err) { return false; }
  };
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    try { if (entity.dimension.id === DIM_ID && isMob(entity)) entity.remove(); } catch (e) {}
  });
  // varredura de seguranca (mobs ja existentes / carregados depois)
  system.runInterval(() => {
    try {
      for (const e of world.getDimension(DIM_ID).getEntities({ families: ["mob"], excludeTypes: ["minecraft:player"] })) {
        try { e.remove(); } catch (err) {}
      }
    } catch (e) {}
  }, 40);
}

if (PROTEGER_BLOCOS) {
  world.beforeEvents.explosion.subscribe((e) => {
    if (e.dimension.id !== DIM_ID) return;
    try { e.setImpactedBlocks([]); } catch (err) { e.cancel = true; }
  });
  world.beforeEvents.playerBreakBlock.subscribe((e) => {
    let id;
    try { id = e.block.dimension.id; } catch (err) { id = e.player.dimension.id; }
    if (id === DIM_ID) e.cancel = true;
  });
}

world.afterEvents.worldLoad.subscribe(() => {
  loadPlaced();
  migratePatch();
  world.sendMessage("§aTournament of Power carregado. Use §e/tournament:entrar");
});
