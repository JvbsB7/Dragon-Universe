const skills_data = [
  {
    type: "toggle",
    id: "absorption",
    showInSidebar: true,
    requirements: [
      {
        test: "is_race",
        operator: "!=",
        value: "earthling",
      },
      {
        test: "is_race",
        operator: "!=",
        value: "saiyan",
      },
      {
        test: "is_race",
        operator: "!=",
        value: "namekian",
      },
      {
        test: "is_race",
        operator: "!=",
        value: "frost_demon",
      },
      {
        test: "is_race",
        operator: "!=",
        value: "bio_android",
      },
      {
        test: "is_race",
        operator: "!=",
        value: "demon",
      },
    ],
  },
  {
    type: "toggle",
    id: "aura_boost",
    functionSlot: 6,
    isPassive: false,
    kiDrain: 1,
    price: 1,
    propertyId: "dbe:aura_boost",
    availableTrainers: ["dbe:cell_npc", "dbe:kami_sama"],
    multipliers: {
      flying_speed: 1.5,
      jump: 2,
      ki_consume: 2,
      running_speed: 2,
    },
  },
  {
    type: "toggle",
    id: "burst_move",
    isPassive: false,
    price: 3,
    availableTrainers: ["dbe:cell_npc", "dbe:goku", "dbe:piccolo"],
  },
  {
    type: "toggle",
    id: "divine_ki",
    isPassive: true,
    showHudIcon: true,
  },
  {
    type: "ki_attack",
    id: "final_flash",
    chargeKiDrain: 26,
    chargeSpeed: 1.5,
    offset: [2, 1, 0],
    price: 5,
    propertyIndex: 7,
    shootSound: "skill.final_flash_launch",
    startChargeSound: "skill.final_flash_gun",
    availableTrainers: ["dbe:cell_npc", "dbe:vegeta_npc"],
    kiAttackProperties: {
      type: "beam",
      baseDamage: 7,
      baseScale: 4,
      color0: "#fcf1b1",
      color1: "#d8b05b",
      explosionPower: 6,
      speed: 0.7,
    },
  },
  {
    type: "toggle",
    id: "friendly_fist",
    functionSlot: 8,
    isPassive: false,
    showHudIcon: true,
  },
  {
    type: "toggle",
    id: "fly",
    functionSlot: 3,
    isPassive: false,
    kiDrain: 1,
    price: 2,
    availableTrainers: ["dbe:cell_npc", "dbe:goku", "dbe:mr_popo"],
    tiers: [
      {
        upgradeCost: 1,
        multipliers: {
          flying_speed: 5,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          flying_speed: 6,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          flying_speed: 7,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          flying_speed: 8,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          flying_speed: 9,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          flying_speed: 10,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          flying_speed: 11,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          flying_speed: 12,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          flying_speed: 13,
        },
      },
      {
        multipliers: {
          flying_speed: 14,
        },
      },
    ],
  },
  {
    type: "ki_attack",
    id: "galick_gun",
    chargeKiDrain: 26,
    chargeSpeed: 1.5,
    offset: [2, 1, 0],
    price: 5,
    propertyIndex: 6,
    shootSound: "skill.galick_gun_launch",
    startChargeSound: "skill.galick_gun",
    availableTrainers: ["dbe:cell_npc", "dbe:vegeta_npc"],
    kiAttackProperties: {
      type: "beam",
      baseDamage: 7,
      baseScale: 4,
      color0: "#e7b1fc",
      color1: "#b55bd8",
      explosionPower: 6,
      speed: 0.7,
    },
  },
  {
    type: "ki_attack",
    id: "genki_dama",
    chargeKiDrain: 50,
    chargeSpeed: 0.5,
    offset: [0, 4, 0],
    price: 6,
    propertyIndex: 1,
    availableTrainers: ["dbe:king_kai", "dbe:goku"],
    kiAttackProperties: {
      type: "blast",
      baseDamage: 15,
      baseScale: 20,
      color0: "#FFFFFF",
      color1: "#80ccff",
      explosionPower: 10,
      speed: 0.7,
    },
  },
  {
    type: "toggle",
    id: "gigantification",
    functionSlot: 7,
    isPassive: false,
    kiDrain: 1,
    price: 4,
    availableTrainers: ["dbe:cell_npc", "dbe:piccolo"],
    multipliers: {
      constitution: 1.5,
      dexterity: 0.5,
      jump: 10,
      ki_consume: 2,
      size: 2,
      strength: 1.5,
    },
    requirements: [
      {
        test: "is_race",
        operator: "!=",
        value: "frost_demon",
      },
      {
        test: "is_race",
        operator: "!=",
        value: "glind",
      },
      {
        test: "is_race",
        operator: "!=",
        value: "earthling",
      },
      {
        test: "is_race",
        operator: "!=",
        value: "majin",
      },
      {
        test: "is_race",
        operator: "!=",
        value: "saiyan",
      },
    ],
  },
  {
    type: "toggle",
    id: "hakai",
    isPassive: true,
    price: 40,
    showHudIcon: true,
    availableTrainers: ["dbe:beerus"],
    masteryOptions: {
      grantTrigger: "on_damage",
      hasDecay: true,
    },
    requirements: [
      {
        test: "has_skill",
        value: "ultra_instinct",
        operator: "!=",
      },
    ],
    tiers: [
      {
        upgradeCost: 10,
        multipliers: {
          strength: 1.2,
          willpower: 1.2,
        },
      },
      {
        multipliers: {
          strength: 1.4,
          willpower: 1.4,
        },
      },
    ],
  },
  {
    type: "toggle",
    id: "healing_power",
    isPassive: true,
    functionSlot: 17,
    price: 4,
    availableTrainers: ["dbe:king_kai"],
    tiers: [
      {
        upgradeCost: 1,
        healing: 1,
      },
      {
        upgradeCost: 2,
        healing: 2,
      },
      {
        upgradeCost: 3,
        healing: 3,
      },
    ],
  },
  {
    type: "toggle",
    id: "jump",
    isPassive: true,
    price: 1,
    availableTrainers: ["dbe:cell_npc", "dbe:kami_sama", "dbe:mr_popo"],
    tiers: [
      {
        upgradeCost: 1,
        multipliers: {
          jump: 2,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          jump: 3,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          jump: 4,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          jump: 5,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          jump: 6,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          jump: 7,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          jump: 8,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          jump: 9,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          jump: 10,
        },
      },
      {
        multipliers: {
          jump: 11,
        },
      },
    ],
  },
  {
    type: "toggle",
    id: "kaioken",
    canSwitchTier: true,
    colorPriority: 0,
    functionSlot: 0,
    isPassive: false,
    price: 6,
    propertyId: "dbe:kaioken",
    showHudIcon: true,
    availableTrainers: ["dbe:king_kai"],
    auraProperties: {
      color: "#ff0000",
    },
    tiers: [
      {
        healthDrain: 2,
        upgradeCost: 1,
        multipliers: {
          dexterity: 1.1,
          strength: 1.1,
        },
      },
      {
        healthDrain: 3,
        upgradeCost: 2,
        multipliers: {
          dexterity: 1.15,
          strength: 1.15,
        },
      },
      {
        healthDrain: 4,
        upgradeCost: 3,
        multipliers: {
          dexterity: 1.2,
          strength: 1.2,
        },
      },
      {
        healthDrain: 10,
        upgradeCost: 4,
        multipliers: {
          dexterity: 1.5,
          strength: 1.5,
        },
      },
      {
        healthDrain: 20,
        upgradeCost: 5,
        multipliers: {
          dexterity: 2,
          strength: 2,
        },
      },
      {
        healthDrain: 100,
        multipliers: {
          dexterity: 10,
          strength: 10,
        },
      },
    ],
  },
  {
    type: "ki_attack",
    id: "kamehameha",
    chargeKiDrain: 25,
    chargeSpeed: 1.5,
    offset: [2, 1, 0],
    price: 5,
    propertyIndex: 2,
    shootSound: "skill.kamehameha_launch",
    startChargeSound: "skill.kamehameha",
    availableTrainers: ["dbe:cell_npc", "dbe:master_roshi"],
    kiAttackProperties: {
      type: "beam",
      baseDamage: 6,
      baseScale: 4,
      color0: "#FFFFFF",
      color1: "#14C8F3",
      explosionPower: 6,
      speed: 0.7,
    },
  },
  {
    type: "ki_attack",
    id: "ki_blast",
    canMoveWhileFiring: true,
    chargeKiDrain: 5,
    chargeSpeed: 8,
    ignoreAttackBar: true,
    offset: [1, 1.375, -0.375],
    price: 1,
    propertyIndex: 3,
    shootSound: "common.ki_blast",
    availableTrainers: [
      "dbe:cell_npc",
      "dbe:goku",
      "dbe:master_roshi",
      "dbe:piccolo",
    ],
    kiAttackProperties: {
      type: "blast",
      baseDamage: 1.5,
      breakBlocks: false,
      color0: "#FFFFFF",
      explosionPower: 3,
      speed: 1.5,
    },
  },
  {
    type: "toggle",
    id: "ki_fist",
    functionSlot: 10,
    isPassive: false,
    kiDrainTrigger: "on_hit",
    price: 4,
    availableTrainers: ["dbe:cell_npc", "dbe:goku"],
    tiers: [
      {
        kiDrain: 1,
        upgradeCost: 2,
        multipliers: {
          melee_damage: 1.05,
        },
      },
      {
        kiDrain: 2,
        upgradeCost: 2,
        multipliers: {
          melee_damage: 1.1,
        },
      },
      {
        kiDrain: 3,
        upgradeCost: 2,
        multipliers: {
          melee_damage: 1.15,
        },
      },
      {
        kiDrain: 4,
        upgradeCost: 2,
        multipliers: {
          melee_damage: 1.2,
        },
      },
      {
        kiDrain: 5,
        upgradeCost: 2,
        multipliers: {
          melee_damage: 1.25,
        },
      },
      {
        kiDrain: 6,
        upgradeCost: 2,
        multipliers: {
          melee_damage: 1.3,
        },
      },
      {
        kiDrain: 7,
        upgradeCost: 2,
        multipliers: {
          melee_damage: 1.35,
        },
      },
      {
        kiDrain: 8,
        upgradeCost: 2,
        multipliers: {
          melee_damage: 1.4,
        },
      },
      {
        kiDrain: 9,
        upgradeCost: 2,
        multipliers: {
          melee_damage: 1.45,
        },
      },
      {
        kiDrain: 10,
        multipliers: {
          melee_damage: 1.5,
        },
      },
    ],
  },
  {
    type: "toggle",
    id: "ki_protect",
    functionSlot: 11,
    isPassive: false,
    kiDrainTrigger: "on_damage",
    price: 4,
    availableTrainers: ["dbe:kami_sama"],
    tiers: [
      {
        kiDrain: 1,
        upgradeCost: 2,
        multipliers: {
          defense: 1.05,
        },
      },
      {
        kiDrain: 2,
        upgradeCost: 2,
        multipliers: {
          defense: 1.1,
        },
      },
      {
        kiDrain: 3,
        upgradeCost: 2,
        multipliers: {
          defense: 1.15,
        },
      },
      {
        kiDrain: 4,
        upgradeCost: 2,
        multipliers: {
          defense: 1.2,
        },
      },
      {
        kiDrain: 5,
        upgradeCost: 2,
        multipliers: {
          defense: 1.25,
        },
      },
      {
        kiDrain: 6,
        upgradeCost: 2,
        multipliers: {
          defense: 1.3,
        },
      },
      {
        kiDrain: 7,
        upgradeCost: 2,
        multipliers: {
          defense: 1.35,
        },
      },
      {
        kiDrain: 8,
        upgradeCost: 2,
        multipliers: {
          defense: 1.4,
        },
      },
      {
        kiDrain: 9,
        upgradeCost: 2,
        multipliers: {
          defense: 1.45,
        },
      },
      {
        kiDrain: 10,
        multipliers: {
          defense: 1.5,
        },
      },
    ],
  },
  {
    type: "toggle",
    id: "ki_scythe",
    functionSlot: 5,
    kiDrain: 2,
    kiDrainTrigger: "on_hit",
    price: 18,
    propertyId: "dbe:ki_scythe",
    wilDamage: 2,
    availableTrainers: ["dbe:whis"],
  },
  {
    type: "toggle",
    id: "ki_sense",
    isPassive: true,
    price: 3,
    availableTrainers: ["dbe:cell_npc", "dbe:mr_popo"],
    tiers: [
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      {},
    ],
  },
  {
    type: "ki_attack",
    id: "kienzan",
    chargeKiDrain: 30,
    chargeSpeed: 1.5,
    offset: [0, 2, -0.375],
    price: 4,
    propertyIndex: 4,
    availableTrainers: ["dbe:cell_npc", "dbe:krillin"],
    kiAttackProperties: {
      type: "disc",
      baseDamage: 2,
      baseScale: 2,
      canCutTail: true,
      color0: "#ffe6a0",
      color1: "#f7d12a",
      speed: 3,
    },
  },
  {
    type: "toggle",
    id: "legendary",
    colorPriority: 2,
    isPassive: true,
    showHudIcon: true,
    spawnChance: 1,
    auraProperties: {
      kiBarColor: "green",
      color: "#8fff45",
    },
    multipliers: {
      dexterity: 1.4,
      size: 1.1,
      strength: 1.4,
    },
    requirements: [
      {
        test: "is_race",
        value: "saiyan",
      },
    ],
  },
  {
    type: "toggle",
    id: "limiter",
    activationSound: "common.force",
    functionSlot: 12,
    canSwitchTier: true,
    isPassive: false,
    tiers: [
      {
        activationSound: "common.power_down",
        upgradeCost: 1,
        multipliers: {
          constitution: 0.5,
          dexterity: 0.5,
          spirit: 0.5,
          strength: 0.5,
          willpower: 0.5,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          constitution: 0.6,
          dexterity: 0.6,
          spirit: 0.6,
          strength: 0.6,
          willpower: 0.6,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          constitution: 0.7,
          dexterity: 0.7,
          spirit: 0.7,
          strength: 0.7,
          willpower: 0.7,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          constitution: 0.8,
          dexterity: 0.8,
          spirit: 0.8,
          strength: 0.8,
          willpower: 0.8,
        },
      },
      {
        upgradeCost: 1,
        multipliers: {
          constitution: 0.9,
          dexterity: 0.9,
          spirit: 0.9,
          strength: 0.9,
          willpower: 0.9,
        },
      },
    ],
  },
  {
    type: "toggle",
    id: "majin_mark",
    isPassive: true,
    price: 6,
    propertyId: "dbe:has_majin_mark",
    removeOnDeath: true,
    showHudIcon: true,
    availableTrainers: ["dbe:babidi"],
    multipliers: {
      melee_damage: 1.2,
      defense: 1.2,
      willpower: 0.8,
    },
    requirements: [
      {
        test: "is_alignment",
        value: "evil",
      },
    ],
  },
  {
    type: "ki_attack",
    id: "makankosappo",
    chargeKiDrain: 25,
    offset: [2.5, 1, -0.375],
    price: 6,
    propertyIndex: 5,
    shootSound: "skill.makankosappo.launch",
    startChargeSound: "skill.makankosappo",
    kiAttackProperties: {
      type: "beam",
      baseDamage: 5,
      baseScale: 1,
      color0: "#E8DF41",
      color1: "#D50FDE",
      hasSpiral: true,
      speed: 1,
    },
  },
  {
    type: "toggle",
    id: "metamoran_dance",
    functionSlot: 9,
    isPassive: false,
    price: 12,
    showHudIcon: true,
    availableTrainers: ["dbe:goku"],
  },
  {
    type: "toggle",
    id: "potential_unleashed",
    isPassive: true,
    price: 10,
    availableTrainers: ["dbe:king_kai"],
    tiers: [
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      { upgradeCost: 1 },
      {},
    ],
  },
  {
    type: "toggle",
    id: "rapid_movement",
    isPassive: false,
    price: 3,
    availableTrainers: ["dbe:cell_npc", "dbe:goku"],
  },
  {
    type: "toggle",
    id: "ultra_instinct",
    canSwitchTier: true,
    chargeTime: 100,
    colorPriority: 1,
    functionSlot: 2,
    isPassive: false,
    price: 40,
    showHudIcon: true,
    availableTrainers: ["dbe:whis"],
    auraProperties: {
      kiBarColor: "white",
    },
    requirements: [
      {
        test: "has_skill",
        value: "divine_ki",
      },
      {
        test: "has_skill",
        value: "hakai",
        operator: "!=",
      },
      {
        test: "is_transformation",
        operator: "!=",
        raceId: "saiyan",
        value: "oozaru",
      },
      {
        test: "is_transformation",
        operator: "!=",
        raceId: "saiyan",
        value: "golden_oozaru",
      },
    ],
    tiers: [
      {
        upgradeCost: 10,
        colorOverrides: {
          eyes: "#DEE7EA",
        },
        multipliers: {
          dexterity: 1.25,
          dodge: 8,
          willpower: 1.25,
        },
      },
      {
        colorOverrides: {
          eyes: "#DEE7EA",
          hair: "#dbf1ff",
        },
        multipliers: {
          dexterity: 1.5,
          dodge: 12,
          willpower: 1.5,
        },
      },
    ],
  },
];
export { skills_data };
