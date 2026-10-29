const races_data = [
  {
    id: "earthling",
    regenRate: 1,
    colorIndexes: {
      aura: 0,
      eyes: 2,
      hair: 1,
    },
    customizations: {
      hasBabyForm: true,
      hasGender: true,
      options: {
        beard: {
          type: "variant",
          activeGenders: ["male"],
          barberEditable: true,
          optionCount: 6,
          propertyIndex: 2,
        },
        eyes: {
          type: "variant",
          optionCount: 3,
          propertyIndex: 3,
        },
        eye_color: {
          type: "color",
          colorId: "eyes",
          palette: ["#191919", "#7E6856", "#3893EA", "#520A0A", "#78C355"],
        },
        hair: {
          type: "variant",
          barberEditable: true,
          optionCount: 11,
          propertyIndex: 1,
        },
        hair_color: {
          type: "color",
          barberEditable: true,
          colorId: "hair",
          palette: ["#000000", "#392821", "#F0DD9E", "#9D2C2C"],
        },
        skin: {
          type: "variant",
          optionCount: 5,
          propertyIndex: 0,
        },
      },
    },
    defaultSkills: ["friendly_fist"],
    multipliers: {
      constitution: 1,
      dexterity: 1,
      strength: 1,
      spirit: 1.25,
      willpower: 1.25,
    },
    transformations: [
      {
        id: "buffed",
        bodyType: "muscular",
        auraProperties: {
          color: "#6FD4FA",
        },
        multipliers: {
          dexterity: 1.3,
          ki_consume: 2,
          size: 1.05,
          strength: 1.3,
          willpower: 1.3,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 10,
          },
        ],
      },
      {
        id: "full_released",
        auraProperties: {
          color: "#6FD4FA",
        },
        multipliers: {
          dexterity: 1.8,
          ki_consume: 3,
          size: 1.1,
          strength: 1.8,
          willpower: 1.8,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 30,
          },
        ],
      },
      {
        id: "god",
        auraProperties: {
          type: "divine",
          soundIndex: 1,
          color: "#FA8200",
        },
        multipliers: {
          dexterity: 2.6,
          ki_consume: 3,
          strength: 2.6,
          willpower: 2.6,
        },
        requirements: [
          {
            test: "has_skill",
            value: "divine_ki",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 56,
          },
        ],
      },
      "ultimate_form",
      "beast",
      "ultra_ego",
    ],
  },
  {
    id: "saiyan",
    regenRate: 1,
    modifiers: ["saiyan_tail"],
    colorIndexes: {
      aura: 0,
      eyes: 2,
      hair: 1,
      tail: 3,
    },
    defaultSkills: ["friendly_fist"],
    multipliers: {
      constitution: 1,
      dexterity: 1,
      strength: 1.5,
      spirit: 1,
      willpower: 1,
    },
    customizations: {
      hasBabyForm: true,
      hasGender: true,
      options: {
        beard: {
          type: "variant",
          activeGenders: ["male"],
          barberEditable: true,
          optionCount: 6,
          propertyIndex: 2,
        },
        eyes: {
          type: "variant",
          optionCount: 2,
          propertyIndex: 3,
        },
        eye_color: {
          type: "color",
          colorId: "eyes",
          palette: ["#191919", "#7E6856", "#3893EA", "#520A0A", "#78C355"],
        },
        hair: {
          type: "variant",
          barberEditable: true,
          optionCount: 7,
          propertyIndex: 1,
        },
        hair_color: {
          type: "color",
          barberEditable: true,
          colorId: "hair",
          palette: [
            "#000000",
            "#392821",
            "#F0DD9E",
            "#A865C3",
            "#2381C6",
            "#9D2C2C",
          ],
        },
        skin: {
          type: "variant",
          optionCount: 5,
          propertyIndex: 0,
        },
        tail_color: {
          type: "color",
          colorId: "tail",
          palette: ["#7C4D2C"],
        },
      },
    },
    transformations: [
      {
        id: "oozaru",
        isArmorVisible: false,
        kiDrain: 0,
        auraProperties: {
          color: "#6FD4FA",
        },
        multipliers: {
          dexterity: 1.3,
          dodge: 0,
          jump: 10,
          size: 2,
          stamina: 2,
          strength: 1.3,
          willpower: 1.3,
        },
        requirements: [
          {
            test: "has_modifier",
            value: "saiyan_tail",
          },
          {
            test: "time_of_day",
            value: "night",
          },
          {
            test: "is_skill_enabled",
            operator: "!=",
            value: "ultra_instinct",
          },
        ],
        tags: ["oozaru"],
      },
      {
        id: "ssj",
        multipliers: {
          dexterity: 1.8,
          ki_consume: 2,
          strength: 1.8,
          willpower: 1.8,
        },
        auraProperties: {
          kiBarColor: "yellow",
          overridableByLegendary: true,
          color: "#F7E248",
        },
        colorOverrides: {
          eyes: "#6DC9C8",
          hair: "#F0DD9E",
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 32,
          },
        ],
      },
      {
        id: "assj",
        bodyType: "muscular",
        auraProperties: {
          kiBarColor: "yellow",
          overridableByLegendary: true,
          color: "#F7E248",
        },
        multipliers: {
          dexterity: 2.2,
          ki_consume: 4,
          size: 1.1,
          strength: 2.2,
          willpower: 2.2,
        },
        colorOverrides: {
          eyes: "#6DC9C8",
          hair: "#F0DD9E",
        },
        requirements: [
          {
            test: "has_mastery",
            value: "ssj",
            multiplier: 2,
          },
        ],
      },
      {
        id: "ssj2",
        auraProperties: {
          kiBarColor: "yellow",
          overridableByLegendary: true,
          sparks: true,
          color: "#F7E248",
        },
        multipliers: {
          dexterity: 2.7,
          ki_consume: 3,
          strength: 2.7,
          willpower: 2.7,
        },
        colorOverrides: {
          eyes: "#6DC9C8",
          hair: "#F0DD9E",
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 50,
          },
        ],
      },
      {
        id: "ssj3",
        auraProperties: {
          kiBarColor: "yellow",
          overridableByLegendary: true,
          sparks: true,
          color: "#F7E248",
        },
        multipliers: {
          dexterity: 3,
          ki_consume: 6,
          size: 1.1,
          strength: 3,
          willpower: 3,
        },
        colorOverrides: {
          eyes: "#6DC9C8",
          hair: "#E4C88A",
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 60,
          },
        ],
      },
      {
        id: "lssj",
        bodyType: "muscular",
        auraProperties: {
          overridableByLegendary: true,
        },
        colorOverrides: {
          eyes: "#FFFFFF",
          hair: "#98D865",
        },
        multipliers: {
          dexterity: 3.25,
          ki_consume: 6,
          size: 1.1,
          strength: 3.25,
        },
        requirements: [
          {
            test: "has_skill",
            value: "legendary",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 32,
          },
        ],
      },
      "ultimate_form",
      {
        id: "golden_oozaru",
        isArmorVisible: false,
        kiDrain: 0,
        auraProperties: {
          kiBarColor: "yellow",
          overridableByLegendary: true,
          color: "#F7E248",
        },
        multipliers: {
          dexterity: 2.1,
          dodge: 0,
          jump: 10,
          size: 2,
          stamina: 2,
          strength: 2.1,
          willpower: 2.1,
        },
        requirements: [
          {
            test: "has_mastery",
            value: "ssj",
            multiplier: 2,
          },
          {
            test: "has_mastery",
            value: "oozaru",
            multiplier: 2,
          },
          {
            test: "has_modifier",
            value: "saiyan_tail",
          },
          {
            test: "time_of_day",
            value: "night",
          },
          {
            test: "is_skill_enabled",
            operator: "!=",
            value: "ultra_instinct",
          },
        ],
        tags: ["oozaru"],
      },
      {
        id: "ssj4",
        auraProperties: {
          kiBarColor: "yellow",
          sparks: true,
          color: "#F7E248",
        },
        colorOverrides: {
          eyes: "#D58900",
          tail: "#B0051D",
        },
        multipliers: {
          dexterity: 3.2,
          ki_consume: 4,
          size: 1.1,
          strength: 3.2,
          willpower: 3.2,
        },
        requirements: [
          {
            test: "has_modifier",
            value: "saiyan_tail",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 76,
          },
        ],
      },
      {
        id: "ssjg",
        bodyType: "slim",
        auraProperties: {
          type: "divine",
          soundIndex: 1,
          color: "#FA8200",
        },
        colorOverrides: {
          eyes: "#D4222C",
          hair: "#BE163A",
        },
        multipliers: {
          dexterity: 3.4,
          ki_consume: 3,
          strength: 3.4,
          willpower: 3.4,
        },
        requirements: [
          {
            test: "has_skill",
            value: "divine_ki",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 84,
          },
        ],
      },
      {
        id: "ssjb",
        auraProperties: {
          soundIndex: 1,
          color: "#0084FA",
        },
        colorOverrides: {
          eyes: "#3A99D2",
          hair: "#5DBFFF",
        },
        multipliers: {
          dexterity: 3.6,
          ki_consume: 5,
          strength: 3.6,
          willpower: 3.6,
        },
        requirements: [
          {
            test: "has_skill",
            value: "divine_ki",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 96,
          },
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil",
          },
        ],
      },
      {
        id: "ssjr",
        auraProperties: {
          kiBarColor: "pink",
          soundIndex: 1,
          color: "#F500AA",
        },
        colorOverrides: {
          eyes: "#B5B7B6",
          hair: "#F396B3",
        },
        multipliers: {
          dexterity: 3.6,
          ki_consume: 5,
          strength: 3.6,
          willpower: 3.6,
        },
        requirements: [
          {
            test: "has_skill",
            value: "divine_ki",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 96,
          },
          {
            test: "is_alignment",
            value: "evil",
          },
        ],
      },
      {
        id: "ssjbe",
        auraProperties: {
          soundIndex: 1,
          sparks: true,
          color: "#0084FA",
        },
        colorOverrides: {
          eyes: "#2A6BC9",
          hair: "#3C92E0",
        },
        multipliers: {
          dexterity: 3.8,
          ki_consume: 6,
          strength: 3.8,
          willpower: 3.8,
        },
        requirements: [
          {
            test: "has_skill",
            value: "divine_ki",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 104,
          },
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil",
          },
        ],
      },
      {
        id: "ssjre",
        auraProperties: {
          kiBarColor: "pink",
          soundIndex: 1,
          sparks: true,
          color: {
            red: 245,
            green: 0,
            blue: 170,
          },
        },
        colorOverrides: {
          eyes: "#FCBDD7",
          hair: "#D76281",
        },
        multipliers: {
          dexterity: 3.8,
          ki_consume: 6,
          strength: 3.8,
          willpower: 3.8,
        },
        requirements: [
          {
            test: "has_skill",
            value: "divine_ki",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 104,
          },
          {
            test: "is_alignment",
            value: "evil",
          },
        ],
      },
      "beast",
      "ultra_ego",
    ],
  },
  {
    id: "namekian",
    regenRate: 1.6,
    colorIndexes: {
      aura: 0,
      eyes: 1,
    },
    multipliers: {
      constitution: 1.5,
      dexterity: 1,
      size: 1.05,
      strength: 1,
      spirit: 1,
      willpower: 1,
    },
    customizations: {
      options: {
        skin: {
          type: "variant",
          optionCount: 4,
          propertyIndex: 0,
        },
        skin_details: {
          type: "variant",
          optionCount: 2,
          propertyIndex: 1,
        },
        face: {
          type: "variant",
          optionCount: 3,
          propertyIndex: 2,
        },
        antennas: {
          type: "variant",
          optionCount: 2,
          propertyIndex: 3,
        },
      },
    },
    defaultSkills: ["friendly_fist", "healing_power"],
    transformations: [
      {
        id: "full_released",
        auraProperties: {
          color: "#6FD4FA",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 1.8,
          ki_consume: 3,
          size: 1.1,
          strength: 1.8,
          willpower: 1.8,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 26,
          },
        ],
      },
      {
        id: "potential_unleashed",
        auraProperties: {
          color: "#FA8200",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 2.75,
          ki_consume: 3,
          strength: 2.75,
          willpower: 2.75,
        },
        requirements: [
          {
            test: "has_skill",
            value: "potential_unleashed",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 40,
          },
        ],
      },
      "ultimate_form",
      {
        id: "orange_form",
        showHudIcon: true,
        auraProperties: {
          kiBarColor: "yellow",
          soundIndex: 1,
          color: "#FA8200",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 3.7,
          ki_consume: 6,
          size: 1.2,
          strength: 3.7,
          willpower: 3.7,
        },
        requirements: [
          {
            test: "has_skill",
            value: "potential_unleashed",
          },
          {
            test: "has_level",
            operator: ">=",
            value: 100,
          },
        ],
      },
      "beast",
      "ultra_ego",
    ],
  },
  {
    id: "frost_demon",
    regenRate: 1.2,
    colorIndexes: {
      aura: 0,
      eyes: 1,
    },
    defaultSkills: ["friendly_fist"],
    multipliers: {
      constitution: 1,
      dexterity: 1.25,
      size: 0.95,
      strength: 1,
      spirit: 1,
      willpower: 1.25,
    },
    customizations: {
      options: {
        skin: {
          type: "variant",
          optionCount: 5,
          propertyIndex: 0,
        },
        shoulder_pads: {
          type: "variant",
          optionCount: 2,
          propertyIndex: 1,
        },
        horns: {
          type: "variant",
          optionCount: 2,
          propertyIndex: 2,
        },
      },
    },
    transformations: [
      {
        id: "second_form",
        bodyType: "muscular",
        auraProperties: {
          color: "#FF1CF7",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 1.2,
          ki_consume: 2,
          size: 1.3,
          strength: 1.2,
          willpower: 1.2,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 10,
          },
        ],
      },
      {
        id: "third_form",
        bodyType: "muscular",
        auraProperties: {
          color: "#FF1CF7",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 1.5,
          ki_consume: 3,
          size: 1.2,
          strength: 1.5,
          willpower: 1.5,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 20,
          },
        ],
      },
      {
        id: "fourth_form",
        auraProperties: {
          color: "#FF1CF7",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 1.8,
          ki_consume: 2,
          strength: 1.8,
          willpower: 1.8,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 28,
          },
        ],
      },
      {
        id: "full_power",
        bodyType: "muscular",
        auraProperties: {
          color: "#FF1CF7",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 2.2,
          ki_consume: 3,
          size: 1.15,
          strength: 2.2,
          willpower: 2.2,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 40,
          },
        ],
      },
      {
        id: "fifth_form",
        bodyType: "muscular",
        auraProperties: {
          color: "#FF1CF7",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 3,
          ki_consume: 3,
          size: 1.2,
          strength: 3,
          willpower: 3,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 64,
          },
        ],
      },
      "ultimate_form",
      {
        id: "golden_form",
        auraProperties: {
          kiBarColor: "yellow",
          color: "#F7E248",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 3.6,
          ki_consume: 4,
          strength: 3.6,
          willpower: 3.6,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 90,
          },
        ],
      },
      {
        id: "black_form",
        auraProperties: {
          color: {
            red: 187,
            green: 41,
            blue: 255,
          },
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 4,
          ki_consume: 5,
          strength: 4,
          willpower: 4,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 120,
          },
        ],
      },
      "beast",
      "ultra_ego",
    ],
  },
  {
    id: "majin",
    regenRate: 2,
    colorIndexes: {
      aura: 0,
      eyes: 2,
    },
    multipliers: {
      constitution: 1.25,
      dexterity: 1.25,
      size: 0.95,
      strength: 1,
      spirit: 1,
      willpower: 1,
    },
    customizations: {
      hasBabyForm: true,
      hasGender: true,
      options: {
        eyes: {
          type: "color",
          colorId: "eyes",
          palette: ["#C7001C"],
        },
        skin: {
          type: "variant",
          optionCount: 9,
          propertyIndex: 0,
        },
      },
    },
    defaultSkills: ["absorption", "friendly_fist", "healing_power"],
    transformations: [
      {
        id: "pure_majin",
        auraProperties: {
          color: "#FF1CF7",
        },
        multipliers: {
          dexterity: 2.7,
          ki_consume: 3,
          regen_rate: 1.1,
          strength: 2.7,
          willpower: 2.7,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 40,
          },
        ],
      },
      {
        id: "super_majin",
        auraProperties: {
          color: "#FF1CF7",
        },
        multipliers: {
          dexterity: 3,
          ki_consume: 5,
          regen_rate: 1.2,
          size: 1.1,
          strength: 3,
          willpower: 3,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 56,
          },
        ],
      },
      "ultimate_form",
      {
        id: "ultra_majin",
        auraProperties: {
          color: "#FF1CF7",
        },
        multipliers: {
          dexterity: 3.2,
          ki_consume: 2,
          regen_rate: 1.4,
          strength: 3.2,
          willpower: 3.2,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 80,
          },
        ],
      },
      "beast",
      "ultra_ego",
    ],
  },
  {
    id: "bio_android",
    regenRate: 1.7,
    colorIndexes: {
      aura: 0,
      eyes: 1,
    },
    multipliers: {
      constitution: 1.25,
      dexterity: 1,
      size: 1.05,
      strength: 1.25,
      spirit: 1,
      willpower: 1,
    },
    customizations: {
      options: {
        skin: {
          type: "variant",
          optionCount: 6,
          propertyIndex: 0,
        },
      },
    },
    defaultSkills: ["friendly_fist", "healing_power"],
    transformations: [
      {
        id: "semi_perfect",
        isBase: true,
        kiDrain: 0,
        auraProperties: {
          color: "#F7E248",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 1.4,
          size: 1.2,
          strength: 1.4,
          willpower: 1.4,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 14,
          },
        ],
      },
      {
        id: "perfect",
        isBase: true,
        kiDrain: 0,
        auraProperties: {
          kiBarColor: "yellow",
          sparks: true,
          color: "#F7E248",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 1.8,
          size: 1.1,
          strength: 1.8,
          willpower: 1.8,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 28,
          },
        ],
      },
      {
        id: "full_power",
        bodyType: "muscular",
        auraProperties: {
          kiBarColor: "yellow",
          color: "#F7E248",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 2.2,
          ki_consume: 3,
          size: 1.1,
          strength: 2.2,
          willpower: 2.2,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 40,
          },
        ],
      },
      {
        id: "super_perfect",
        auraProperties: {
          kiBarColor: "yellow",
          sparks: true,
          color: "#F7E248",
        },
        colorOverrides: {
          eyes: "#000000",
        },
        multipliers: {
          dexterity: 2.7,
          ki_consume: 2,
          size: 1.1,
          strength: 2.7,
          willpower: 2.7,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 48,
          },
        ],
      },
      "ultimate_form",
      "beast",
      "ultra_ego",
    ],
  },
  {
    id: "glind",
    regenRate: 1.5,
    colorIndexes: {
      aura: 0,
      eyes: 2,
      hair: 1,
    },
    defaultSkills: ["friendly_fist"],
    multipliers: {
      constitution: 1.1,
      dexterity: 1,
      strength: 1.25,
      spirit: 1.15,
      willpower: 1.1,
    },
    customizations: {
      hasBabyForm: true,
      hasGender: true,
      options: {
        hair: {
          type: "variant",
          barberEditable: true,
          optionCount: 2,
          propertyIndex: 1,
        },
        hair_color: {
          type: "color",
          barberEditable: true,
          colorId: "hair",
          palette: ["#EAE4EC", "#9D2C2C", "#1A0030", "#000000"],
        },
        eyes: {
          type: "variant",
          barberEditable: true,
          optionCount: 2,
          propertyIndex: 2,
        },
        eye_color: {
          type: "color",
          colorId: "eyes",
          palette: ["#FF0000", "#FFB000", "#B000FF", "#FFFFFF"],
        },
        skin: {
          type: "variant",
          optionCount: 4,
          propertyIndex: 0,
        },
        horns: {
          type: "variant",
          optionCount: 3,
          propertyIndex: 3,
        },
      },
    },
    transformations: [
      {
        id: "horned_form",
        bodyType: "muscular",
        auraProperties: {
          color: "#FF6A2E",
        },
        colorOverrides: {
          eyes: "#FFB000",
        },
        multipliers: {
          dexterity: 1.3,
          ki_consume: 2,
          size: 1.05,
          strength: 1.3,
          willpower: 1.3,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 10,
          },
        ],
      },
      {
        id: "infernal_form",
        auraProperties: {
          color: "#FF2200",
        },
        colorOverrides: {
          eyes: "#FF2200",
          hair: "#3A0A0A",
        },
        multipliers: {
          dexterity: 1.8,
          ki_consume: 2,
          strength: 1.8,
          willpower: 1.8,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 25,
          },
        ],
      },
      {
        id: "archdemon",
        bodyType: "muscular",
        auraProperties: {
          color: "#B000FF",
        },
        colorOverrides: {
          eyes: "#FF0000",
          hair: "#1A0030",
        },
        multipliers: {
          dexterity: 2.5,
          ki_consume: 3,
          size: 1.1,
          strength: 2.5,
          willpower: 2.5,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 45,
          },
        ],
      },
      {
        id: "demon_lord",
        bodyType: "muscular",
        auraProperties: {
          sparks: true,
          color: "#7A00CC",
        },
        colorOverrides: {
          eyes: "#FFFFFF",
          hair: "#0D0D0D",
        },
        multipliers: {
          dexterity: 3.3,
          ki_consume: 4,
          size: 1.15,
          strength: 3.3,
          willpower: 3.3,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 70,
          },
        ],
      },
      {
        id: "abyssal_king",
        bodyType: "muscular",
        auraProperties: {
          sparks: true,
          color: "#2B0033",
        },
        colorOverrides: {
          eyes: "#FF0000",
          hair: "#000000",
        },
        multipliers: {
          dexterity: 4.2,
          ki_consume: 5,
          size: 1.2,
          strength: 4.2,
          willpower: 4.2,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 100,
          },
        ],
      },
      {
        id: "true_oni_rage",
        bodyType: "muscular",
        auraProperties: {
          sparks: true,
          color: "#FF1111",
        },
        colorOverrides: {
          eyes: "#FF0000",
        },
        multipliers: {
          dexterity: 7.6,
          ki_consume: 6,
          size: 1.15,
          strength: 7.6,
          willpower: 7.6,
        },
        requirements: [
          {
            test: "has_level",
            operator: ">=",
            value: 100,
          },
          {
            test: "has_modifier",
            value: "oni_blessing",
          },
        ],
      },
      "ultra_ego",
      "ultimate_form",
    ],
  },
];
export { races_data };
