// Integridade dos dados em Dragon Block_bp/scripts/data/*.js (importados sem alteração):
// raças, skills, transformações, cores de ki, treinadores, missões, diálogos, desejos e
// chaves de idioma nas três línguas (en_US, es_ES, pt_BR).
// Uso: node tools/check-data.mjs
import path from "node:path";
import { BP, RP, Report, cachedJson, isMain, loadDataModules, loadJsonDir, readLang } from "./lib/common.mjs";
import { CORE_SKILL_TRAINERS } from "./lib/allowlist.mjs";

const LANGS = ["en_US", "es_ES", "pt_BR"];
// Segundos segmentos de "quest.<x>.*" que são textos genéricos da interface, não missões.
const GENERIC_QUEST_KEYS = new Set(["challenge", "main", "mentor", "side", "objective", "objective_completed", "reward"]);
// Chaves de entityDefinitions que o núcleo lê (confirmado nas strings do núcleo). "attributes" é ignorado.
const ENTITY_DEFINITION_KEYS = new Set(["powerDefinition", "availableTransformations", "friendlyDamage", "alwaysDodge", "kiColor", "skills", "spawnEvent"]);

/**
 * Cores aceitas em auraProperties.kiBarColor: o núcleo envia o nome direto para a HUD,
 * que só tem os painéis "<cor>_ki_bar" declarados em ui/hud_screen/stats_bar.json.
 */
function kiBarPanels() {
  const data = cachedJson(path.join(RP, "ui", "hud_screen", "stats_bar.json")).data;
  const colors = new Set();
  const visit = (v) => {
    if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (k === "$ki_bar_color" && x) colors.add(x);
        visit(x);
      }
    }
  };
  visit(data?.ki_bar_root);
  return colors;
}

/** Visita todos os objetos de um valor, chamando fn(obj, caminho). */
function eachObject(value, fn, trail = "") {
  if (Array.isArray(value)) value.forEach((v, i) => eachObject(v, fn, `${trail}[${i}]`));
  else if (value && typeof value === "object") {
    fn(value, trail);
    for (const [k, v] of Object.entries(value)) eachObject(v, fn, `${trail}.${k}`);
  }
}

function duplicates(list, key = (x) => x.id) {
  const seen = new Set();
  const dup = new Set();
  for (const x of list) {
    const k = key(x);
    if (seen.has(k)) dup.add(k);
    seen.add(k);
  }
  return [...dup];
}

export async function run() {
  const report = new Report("check-data — integridade de scripts/data");
  const { modules: m, errors } = await loadDataModules();
  for (const e of errors) report.error("Falha ao importar módulo de dados", `${e.file} — ${e.message}`);
  const get = (mod, exp) => m[mod]?.[exp] ?? (report.error("Export ausente", `${mod}.js não exporta ${exp}`), []);

  const races = get("races_data", "races_data");
  const skills = get("skills_data", "skills_data");
  const globalForms = get("global_transformations_data", "global_transformations_data");
  const kiColors = get("ki_colors_data", "ki_colors_data");
  const entities = get("entities_data", "entity_data");
  const dialogues = get("dialogues_data", "dialogues_data");
  const masters = get("masters_data", "masters_data");
  const wishes = get("wish_data", "wish_data");
  const dragonBalls = get("dragon_balls_data", "dragonBallsData");
  const regions = get("regions_data", "regionsData");
  const achievements = get("achievements_data", "achievements_data");
  const modifiers = get("modifiers_data", "modifiers_data");
  const shops = get("shop_data", "shop_data");
  const mentorQuests = masters.flatMap((ms) => (ms.teachings ?? []).map((t) => t.trialQuest).filter(Boolean));
  const quests = [
    ...get("main_quests_data", "main_quests_data").map((q) => ({ q, src: "main_quests_data" })),
    ...get("side_quests_data", "side_quests_data").map((q) => ({ q, src: "side_quests_data" })),
    ...get("challenge_quests_data", "challenge_quests_data").map((q) => ({ q, src: "challenge_quests_data" })),
    ...mentorQuests.map((q) => ({ q, src: "masters_data (trialQuest)" })),
  ];

  const raceIds = new Set(races.map((r) => r.id));
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const questIds = new Set(quests.map(({ q }) => q.id));
  const regionIds = new Set(regions.map((r) => r.id));
  const modifierIds = new Set(modifiers.map((x) => x.id));
  const globalFormIds = new Set(globalForms.map((g) => g.id));
  // Transformações de raça podem ser objetos ({ id, ... }) ou strings que apontam para uma transformação global.
  const formId = (t) => (typeof t === "string" ? t : t?.id);
  const formsByRace = new Map(races.map((r) => [r.id, new Set((r.transformations ?? []).map(formId))]));
  const entityById = new Map(entities.map((e) => [e.id, e]));
  // Formas próprias de entidades (com multiplicadores) também podem ser usadas pelas missões.
  const formsOfEntity = (e) => new Set((e?.transformations ?? []).map(formId));
  const allForms = new Set(["base", ...globalFormIds, ...[...formsByRace.values()].flatMap((s) => [...s]), ...entities.flatMap((e) => [...formsOfEntity(e)])]);
  const dialogueIds = new Set();
  eachObject(dialogues, (o) => {
    if (o.id && (o.npcId || o.type || o.body || o.buttons)) dialogueIds.add(o.id);
  });

  // ---------------------------------------------------------------- ids duplicados
  const lists = [
    ["races_data", races],
    ["skills_data", skills],
    ["global_transformations_data", globalForms],
    ["entities_data", entities],
    ["achievements_data", achievements],
    ["regions_data", regions],
    ["modifiers_data", modifiers],
    ["missões (main/side/challenge/mentor)", quests.map(({ q }) => q)],
  ];
  for (const [name, list] of lists) for (const id of duplicates(list)) report.error("Id duplicado nos dados", `${id} — ${name}`);
  for (const r of races) for (const id of duplicates(r.transformations ?? [], formId)) report.error("Id duplicado nos dados", `transformação ${id} — raça ${r.id}`);
  for (const r of races) {
    for (const t of r.transformations ?? []) {
      if (typeof t === "string" && !globalFormIds.has(t)) report.error("Transformação inexistente", `${t} (referência a transformação global) — races_data → ${r.id}.transformations`);
    }
  }
  for (const id of duplicates(wishes, (w) => `${w.type}:${w.name}`)) report.error("Id duplicado nos dados", `desejo ${id} — wish_data`);
  for (const s of shops) for (const id of duplicates(s.catalog ?? [])) report.error("Id duplicado nos dados", `${id} — loja ${s.id}`);

  // ---------------------------------------------------------------- referências genéricas (requisitos, recompensas, tarefas)
  const raceRef = (id, where) => {
    if (id !== undefined && !raceIds.has(id)) report.error("Raça inexistente em races_data", `${id} — ${where}`);
  };
  const skillRef = (id, where) => {
    if (id !== undefined && !skillById.has(id)) report.error("Skill inexistente em skills_data", `${id} — ${where}`);
  };
  const kiColorRef = (c, where) => {
    if (c !== undefined && !(c in kiColors)) report.error("Cor de ki inexistente em ki_colors_data", `${c} — ${where}`);
  };
  const barPanels = kiBarPanels();
  const kiBarRef = (c, where) => {
    if (c !== undefined && !barPanels.has(c)) report.error("kiBarColor sem painel na HUD (ui/hud_screen/stats_bar.json)", `${c} — ${where}`);
  };
  const formRef = (id, raceId, where) => {
    if (id === undefined) return;
    const ok = raceId ? formsByRace.get(raceId)?.has(id) || globalFormIds.has(id) : allForms.has(id);
    if (!ok) report.error("Transformação inexistente", `${id}${raceId ? ` (raça ${raceId})` : ""} — ${where}`);
  };

  const sources = {
    races_data: races,
    skills_data: skills,
    global_transformations_data: globalForms,
    entities_data: entities,
    dialogues_data: dialogues,
    masters_data: masters,
    wish_data: wishes,
    achievements_data: achievements,
    shop_data: shops,
    main_quests_data: m.main_quests_data?.main_quests_data,
    side_quests_data: m.side_quests_data?.side_quests_data,
    challenge_quests_data: m.challenge_quests_data?.challenge_quests_data,
  };
  for (const [src, data] of Object.entries(sources)) {
    eachObject(data, (o, trail) => {
      const where = `${src}${trail}`;
      // Requisitos { test, value, operator }.
      if (typeof o.test === "string") {
        if (o.test === "is_race") {
          if (o.value === undefined) report.error("Requisito sem valor", `is_race sem "value" — ${where}`);
          raceRef(o.value, where);
        }
        if (o.test === "has_skill" || o.test === "is_skill_enabled") skillRef(o.value, where);
        if (o.test === "is_transformation" || o.test === "has_mastery") {
          raceRef(o.raceId, where);
          formRef(o.value, o.raceId, where);
        }
        if (o.test === "completed_quest" || o.test === "has_quest") {
          if (!questIds.has(o.value)) report.error("Missão inexistente", `${o.value} — ${where}`);
        }
        if (o.test === "has_modifier" && !modifierIds.has(o.value)) report.error("Modificador inexistente em modifiers_data", `${o.value} — ${where}`);
      }
      // Recompensas e tarefas.
      if (o.type === "race" && "race" in o) raceRef(o.race, where);
      if (o.type === "skill" && "skill" in o) skillRef(o.skill, where);
      if (o.type === "learn_skill") skillRef(o.skill, where);
      if (o.type === "give_quest" && !questIds.has(o.quest)) report.error("Missão inexistente", `${o.quest} — ${where}`);
      if (o.type === "enter_region" && !regionIds.has(o.region)) report.error("Região inexistente em regions_data", `${o.region} — ${where}`);
      if (o.questId !== undefined && !questIds.has(o.questId)) report.error("Missão inexistente", `${o.questId} — ${where}`);
      if (o.raceId !== undefined && o.overrides) raceRef(o.raceId, where);
      if (o.nextDialogue !== undefined && !dialogueIds.has(o.nextDialogue)) report.error("Diálogo inexistente", `${o.nextDialogue} — ${where}`);
      if (o.backButtonDialogue !== undefined && !dialogueIds.has(o.backButtonDialogue)) report.error("Diálogo inexistente", `${o.backButtonDialogue} — ${where}`);
      if (o.kiColor !== undefined) kiColorRef(o.kiColor, where);
      if (o.kiBarColor !== undefined) kiBarRef(o.kiBarColor, where);
    });
  }

  // ---------------------------------------------------------------- raças
  for (const r of races) {
    for (const s of r.defaultSkills ?? []) skillRef(s, `races_data → ${r.id}.defaultSkills`);
  }
  for (const e of entities) {
    if (e.race !== undefined) raceRef(e.race, `entities_data → ${e.id}.race`);
    for (const s of e.entityDefinitions?.skills ?? []) skillRef(s, `entities_data → ${e.id}.entityDefinitions.skills`);
    // Forma sem multiplicadores é uma referência: precisa existir na raça da entidade.
    for (const t of e.transformations ?? []) {
      const id = formId(t);
      if (typeof t === "object" && t.multipliers) continue;
      const ok = (e.race && formsByRace.get(e.race)?.has(id)) || globalFormIds.has(id);
      if (!ok) report.warn("Transformação de entidade sem multiplicadores e fora da raça", `${id} — entities_data → ${e.id} (raça ${e.race ?? "nenhuma"})`);
    }
  }
  for (const w of wishes) {
    if (w.type === "change_race") raceRef(w.name, `wish_data → change_race "${w.name}"`);
    for (const src of w.availableIn ?? []) {
      if (!dragonBalls.some((b) => b.sourceId === src)) report.error("Desejo disponível em dragão inexistente", `${src} — wish_data → ${w.type} "${w.name}"`);
    }
  }

  // ---------------------------------------------------------------- skills: treinadores e acesso
  const npcsWithSkillsMenu = new Set(CORE_SKILL_TRAINERS);
  for (const dlg of dialogues) {
    let has = false;
    eachObject(dlg, (o) => {
      if (o.type === "skills") has = true;
    });
    if (has) npcsWithSkillsMenu.add(dlg.npcId);
  }
  const rewardedSkills = new Set();
  eachObject([quests.map(({ q }) => q), achievements], (o) => {
    if (o.type === "skill" && o.skill) rewardedSkills.add(o.skill);
  });
  for (const s of skills) {
    for (const t of s.availableTrainers ?? []) {
      if (!npcsWithSkillsMenu.has(t)) {
        report.warn("Treinador sem submenu de skills em dialogues_data", `${s.id} — ${t} não consegue ensinar`);
      }
    }
    const trainers = (s.availableTrainers ?? []).filter((t) => npcsWithSkillsMenu.has(t));
    if (s.price !== undefined && !trainers.length) {
      if (rewardedSkills.has(s.id)) {
        report.warn("Skill com preço mas sem treinador (só obtida como recompensa; o preço não é usado)", s.id);
      } else {
        const listed = s.availableTrainers?.length ? `treinadores sem submenu: ${s.availableTrainers.join(", ")}` : "sem treinadores";
        report.error("Skill inacessível: tem preço mas nenhum treinador acessível nem recompensa", `${s.id} — ${listed}`);
      }
    }
    // Restrição por lista de exclusão de raças: raças novas ganham acesso automaticamente.
    const raceReqs = (s.requirements ?? []).filter((r) => r.test === "is_race");
    if (raceReqs.length >= 2 && raceReqs.every((r) => r.operator === "!=")) {
      report.warn("Skill restringe raças por lista de exclusão (raças novas ganham acesso)", `${s.id} — exclui ${raceReqs.map((r) => r.value ?? "(sem valor)").join(", ")}`);
    }
  }

  // ---------------------------------------------------------------- missões: bioma × dimensão
  // As dimensões próprias são vazias e têm um único bioma (default_biome); esse bioma não existe em outra dimensão.
  const dimensionOfBiome = new Map();
  for (const { data } of loadJsonDir(path.join(BP, "dimensions"))) {
    const dim = data["minecraft:dimension"];
    const biome = dim?.components?.["minecraft:default_biome"]?.biome;
    if (biome) dimensionOfBiome.set(biome, dim.description.identifier);
  }
  for (const { q, src } of quests) {
    (q.objectives ?? []).forEach((ob, oi) =>
      (ob.tasks ?? []).forEach((t, ti) => {
        const expectedDim = t.type === "enter_biome" ? dimensionOfBiome.get(t.biomeId) : undefined;
        if (expectedDim && t.dimensionId !== expectedDim) {
          report.error("Bioma procurado na dimensão errada (missão não conclui)", `${t.biomeId} só existe em ${expectedDim}, mas a tarefa usa ${t.dimensionId} — ${src} → ${q.id}.objectives[${oi}].tasks[${ti}]`);
        }
      }),
    );
  }

  // ---------------------------------------------------------------- missões: entityDefinitions
  for (const { q, src } of quests) {
    (q.objectives ?? []).forEach((ob, oi) =>
      (ob.tasks ?? []).forEach((t, ti) => {
        if (!t.entityDefinitions) return;
        const unknown = Object.keys(t.entityDefinitions).filter((k) => !ENTITY_DEFINITION_KEYS.has(k));
        if (unknown.length) {
          const hint = unknown.includes("attributes") && !t.entityDefinitions.powerDefinition ? " (use powerDefinition)" : "";
          report.error("entityDefinitions com chave não reconhecida", `${unknown.join(", ")}${hint} — ${src} → ${q.id}.objectives[${oi}].tasks[${ti}]`);
        }
        const ent = entityById.get(t.entity);
        const allowed = ent ? new Set(["base", ...formsOfEntity(ent), ...(formsByRace.get(ent.race) ?? []), ...globalFormIds]) : allForms;
        for (const f of t.entityDefinitions.availableTransformations ?? []) {
          if (!allowed.has(formId(f))) {
            report.error("Transformação inexistente", `${formId(f)} — ${src} → ${q.id}.objectives[${oi}].tasks[${ti}] (${t.entity}${ent?.race ? `, raça ${ent.race}` : ""})`);
          }
        }
      }),
    );
  }

  // ---------------------------------------------------------------- idiomas
  const langs = {};
  for (const l of LANGS) {
    const { map, duplicates: dup } = readLang(path.join(RP, "texts", `${l}.lang`));
    langs[l] = map;
    for (const d of dup) report.warn(`Chave repetida em ${l}.lang`, `${d.key} — linhas ${d.first} e ${d.line}`);
  }

  const expected = new Map(); // chave → origem
  const need = (key, where) => expected.has(key) || expected.set(key, where);
  for (const { q, src } of quests) {
    const where = `${src} → ${q.id}`;
    need(`quest.${q.id}.title`, where);
    need(`quest.${q.id}.text`, where);
    for (let i = 1; i <= (q.preDialogCount ?? 0); i++) need(`quest.${q.id}.dialog_${i}`, where);
    (q.objectives ?? []).forEach((ob, oi) => {
      for (const [phase, count] of Object.entries(ob.dialogs ?? {})) {
        for (let i = 1; i <= count; i++) need(`quest.${q.id}.objective_${oi + 1}.${phase}.dialog_${i}`, where);
      }
      (ob.tasks ?? []).forEach((t, ti) => {
        for (let i = 1; i <= (t.dialogCount ?? 0); i++) need(`quest.${q.id}.objective_${oi + 1}.task_${ti + 1}.dialog_${i}`, where);
      });
    });
  }
  for (const a of achievements) {
    need(`achievement.${a.id}.title`, `achievements_data → ${a.id}`);
    need(`achievement.${a.id}.text`, `achievements_data → ${a.id}`);
  }
  eachObject(dialogues, (o, trail) => {
    for (const k of ["title", "text", "buttonText"]) {
      if (typeof o[k] === "string" && /^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(o[k])) need(o[k], `dialogues_data${trail}.${k}`);
    }
  });

  for (const [key, where] of expected) {
    const missing = LANGS.filter((l) => !langs[l].has(key));
    if (missing.length) report.error("Chave de idioma ausente", `${key} — falta em ${missing.join(", ")} (${where})`);
    const blank = LANGS.filter((l) => langs[l].has(key) && /^\s*(""|'')?\s*$/.test(langs[l].get(key).value));
    if (blank.length) report.warn("Texto vazio ou provisório", `${key} — em ${blank.join(", ")} (${where})`);
  }

  // Chaves quest.* que não correspondem a nenhuma missão dos dados (erros de digitação ou missões removidas).
  for (const l of LANGS) {
    for (const key of langs[l].keys()) {
      if (!key.startsWith("quest.")) continue;
      const second = key.split(".")[1];
      if (GENERIC_QUEST_KEYS.has(second) || expected.has(key)) continue;
      const reason = questIds.has(second) ? "não usada pela missão" : "missão inexistente nos dados";
      report.warn(`Chave quest.* órfã em ${l}.lang`, `${key} — ${reason}`);
    }
  }

  // Divergência geral entre as três línguas (fora das chaves já reportadas acima).
  const all = new Set(LANGS.flatMap((l) => [...langs[l].keys()]));
  for (const key of all) {
    if (expected.has(key)) continue;
    const present = LANGS.filter((l) => langs[l].has(key));
    if (present.length < LANGS.length) {
      report.warn("Chave presente só em parte das línguas", `${key} — só em ${present.join(", ")}`);
    }
  }

  report.summary = `${races.length} raças, ${skills.length} skills, ${quests.length} missões, ${entities.length} entidades, ${expected.size} chaves de idioma esperadas`;
  return report;
}

if (isMain(import.meta.url)) (await run()).finish();
