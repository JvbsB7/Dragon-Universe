const entity_data = [
  {
    id: "dbe:absorption_cocoon_entity",
    entityDefinitions: {
      powerDefinition: {
        level: 1,
        focus: {
          constitution: 1,
          dexterity: 1,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      }
    }
  },
  {
    id: "dbe:akira_toriyama",
    race: "earthling"
  },
  {
    id: "dbe:android_17",
    isAndroid: true,
    race: "earthling",
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:android_18",
    isAndroid: true,
    race: "earthling",
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:android_19",
    isAndroid: true,
    race: "earthling",
    scale: 1.1,
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:android_20",
    isAndroid: true,
    race: "earthling",
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:angel_staff_entity"
  },
  {
    id: "dbe:announcer"
  },
  {
    id: "dbe:babidi"
  },
  {
    id: "dbe:battle_jacket",
    entityDefinitions: {
      powerDefinition: {
        level: 1,
        focus: {
          constitution: 1,
          dexterity: 1,
          spirit: 1,
          strength: 1,
          willpower: 0
        }
      }
    }
  },
  {
    id: "dbe:bear_thief"
  },
  {
    id: "dbe:beerus"
  },
  {
    id: "dbe:beerus_enemy",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "hakai",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:bulma",
    race: "earthling"
  },
  {
    id: "dbe:burter",
    entityDefinitions: {
      kiColor: "red",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:botamo",
    entityDefinitions: {
      kiColor: "green",
      skills: [
        "aura_boost"
      ]
    }
  },
  {
    id: "dbe:cabba",
    race: "saiyan",
    scale: 0.85,
    entityDefinitions: {
      skills: [
        "aura_boost",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:capsule_corp_engineer",
    race: "earthling"
  },
  {
    id: "dbe:cell",
    race: "bio_android",
    entityDefinitions: {
      skills: [
        "aura_boost",
        "final_flash",
        "kamehameha",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:cell_junior",
    race: "bio_android",
    scale: 0.9,
    entityDefinitions: {
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:cell_npc",
    race: "bio_android"
  },
  {
    id: "dbe:chi_chi",
    race: "earthling"
  },
  {
    id: "dbe:corrupted_fused_zamasu",
    race: "glind",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:cui",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:dabura",
    entityDefinitions: {
      kiColor: "red",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:damage_indicator"
  },
  {
    id: "dbe:deer"
  },
  {
    id: "dbe:dinosaur"
  },
  {
    id: "dbe:dodoria",
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:drive_test_car"
  },
  {
    id: "dbe:earth"
  },
  {
    id: "dbe:enma_daioh"
  },
  {
    id: "dbe:fat_buu",
    race: "majin",
    scale: 1.3,
    entityDefinitions: {
      kiColor: "pink",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:flying_nimbus"
  },
  {
    id: "dbe:frieza",
    race: "frost_demon",
    entityDefinitions: {
      friendlyDamage: true,
      powerDefinition: {
        level: 35,
        focus: {
          constitution: 1,
          dexterity: 1,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      },
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    },
    transformations: [
      {
        id: "mecha_frieza"
      }
    ]
  },
  {
    id: "dbe:frieza_pod"
  },
  {
    id: "dbe:space_pod"
  },
  {
    id: "dbe:saiyan_pod"
  },
  {
    id: "dbe:frieza_soldier",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:frost",
    race: "frost_demon",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:future_trunks_enemy",
    race: "saiyan",
    entityDefinitions: {
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:fused_zamasu",
    race: "glind",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:general_black",
    race: "earthling"
  },
  {
    id: "dbe:giant_fish"
  },
  {
    id: "dbe:ginyu",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:goku",
    race: "saiyan"
  },
  {
    id: "dbe:goku_black",
    race: "saiyan",
    entityDefinitions: {
      kiColor: "pink",
      skills: [
        "aura_boost",
        "kamehameha",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:goku_enemy",
    race: "saiyan",
    entityDefinitions: {
      skills: [
        "aura_boost",
        "kamehameha",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:grand_elder_guru",
    race: "namekian"
  },
  {
    id: "dbe:guldo",
    scale: 0.9
  },
  {
    id: "dbe:hitto",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:jeice",
    entityDefinitions: {
      kiColor: "red",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:kami_sama",
    race: "namekian"
  },
  {
    id: "dbe:ki_attack"
  },
  {
    id: "dbe:kid_buu",
    race: "majin",
    scale: 0.7,
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:king_cold",
    race: "frost_demon",
    scale: 1.3,
    entityDefinitions: {
      friendlyDamage: true,
      powerDefinition: {
        level: 36,
        focus: {
          constitution: 1,
          dexterity: 1,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      },
      kiColor: "red",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:king_kai"
  },
  {
    id: "dbe:korin",
    race: "earthling"
  },
  {
    id: "dbe:krillin",
    race: "earthling"
  },
  {
    id: "dbe:location"
  },
  {
    id: "dbe:magetta"
  },
  {
    id: "dbe:majin_vegeta",
    race: "saiyan",
    scale: 0.9,
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "final_flash",
        "galick_gun",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:master_roshi",
    race: "earthling"
  },
  {
    id: "dbe:merchant",
    race: "earthling"
  },
  {
    id: "dbe:missile"
  },
  {
    id: "dbe:mr_popo"
  },
  {
    id: "dbe:namekian",
    race: "namekian",
    entityDefinitions: {
      kiColor: "yellow",
      powerDefinition: {
        level: [5, 15],
        focus: {
          constitution: 1,
          dexterity: 1,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      },
      skills: [
        "aura_boost",
        "gigantification",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:namekian_frog"
  },
  {
    id: "dbe:nappa",
    race: "saiyan",
    entityDefinitions: {
      friendlyDamage: true,
      powerDefinition: {
        level: 17,
        focus: {
          constitution: 1,
          dexterity: 1,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      },
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:piccolo",
    race: "namekian"
  },
  {
    id: "dbe:piccolo_enemy",
    race: "namekian",
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "gigantification",
        "ki_blast",
        "makankosappo",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:pirate_robot",
    entityDefinitions: {
      powerDefinition: {
        level: 8,
        focus: {
          constitution: 1,
          dexterity: 2,
          spirit: 1,
          strength: 1,
          willpower: 0
        }
      },
      skills: [
        "aura_boost"
      ]
    }
  },
  {
    id: "dbe:pirate_robot_bullet"
  },
  {
    id: "dbe:player_fly"
  },
  {
    id: "dbe:porunga"
  },
  {
    id: "dbe:puipui",
    entityDefinitions: {
      kiColor: "green",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:pterosaur"
  },
  {
    id: "dbe:raditz",
    race: "saiyan",
    scale: 1.1,
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:recoome",
    entityDefinitions: {
      kiColor: "pink",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    },
    transformations: [
      {
        id: "buffed",
        multipliers: {
          dexterity: 1.5,
          ki_consume: 1,
          size: 1.05,
          strength: 1.5,
          willpower: 1
        }
      }
    ]
  },
  {
    id: "dbe:saber_tooth_tiger"
  },
  {
    id: "dbe:saiyan_villager",
    entityDefinitions: {
      powerDefinition: {
        level: [18, 26],
        focus: {
          constitution: 1,
          dexterity: 1.1,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      }
    }
  },

  {
    // Same stat block as the Frieza boss fight (level 35, frost_demon race multipliers, same focus spread)
    id: "dbe:demonic_iron_golem",
    race: "frost_demon",
    entityDefinitions: {
      powerDefinition: {
        level: 35,
        focus: {
          constitution: 1,
          dexterity: 1.2,
          spirit: 1,
          strength: 1.2,
          willpower: 1.2
        }
      }
    }
  },

  {
    id: "dbe:frieza_villager",
    entityDefinitions: {
      powerDefinition: {
        level: [20, 28],
        focus: {
          constitution: 1,
          dexterity: 1.1,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      }
    }
  },

  {
    id: "dbe:yardrat_villager",
    entityDefinitions: {
      powerDefinition: {
        level: [14, 22],
        focus: {
          constitution: 1,
          dexterity: 1.2,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      }
    }
  },

  {
    id: "dbe:hell_villager",
    entityDefinitions: {
      powerDefinition: {
        level: [24, 32],
        focus: {
          constitution: 1.1,
          dexterity: 1,
          spirit: 1,
          strength: 1.1,
          willpower: 1
        }
      }
    }
  },

  {
    id: "dbe:saibaman",
    scale: 0.95,
    entityDefinitions: {
      powerDefinition: {
        level: 16,
        focus: {
          constitution: 1,
          dexterity: 1.2,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      },
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast"
      ]
    }
  },
  {
    id: "dbe:saibabrute",
    scale: 1.4,
    entityDefinitions: {
      powerDefinition: {
        level: 20,
        focus: {
          constitution: 1.25,
          dexterity: 1.25,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      },
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:shadow_dummy",
    entityDefinitions: {
      powerDefinition: {
        level: 1,
        focus: {
          constitution: 1,
          dexterity: 1,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      },
      friendlyDamage: true
    }
  },
  {
    id: "dbe:shenron"
  },
  {
    id: "dbe:shisami",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:super_buu",
    race: "majin",
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "absorption",
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    },
    transformations: [
      {
        id: "super_buu_gohan",
        multipliers: {
          dexterity: 2.1,
          ki_consume: 2,
          strength: 2.1,
          willpower: 2.1
        }
      },
      {
        id: "super_buu_gotenks",
        multipliers: {
          dexterity: 2.7,
          ki_consume: 2,
          strength: 2.7,
          willpower: 2.7
        }
      }
    ]
  },
  {
    id: "dbe:tagoma",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:test_enemy"
  },
  {
    id: "dbe:time_machine"
  },
  {
    id: "dbe:training_orb"
  },
  {
    id: "dbe:unigame"
  },
  {
    id: "dbe:vegeta",
    race: "saiyan",
    scale: 0.9,
    entityDefinitions: {
      friendlyDamage: true,
      powerDefinition: {
        level: 22,
        focus: {
          constitution: 1,
          dexterity: 1,
          spirit: 1,
          strength: 1,
          willpower: 1
        }
      },
      kiColor: "purple",
      skills: [
        "aura_boost",
        "final_flash",
        "galick_gun",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:vegeta_npc",
    race: "saiyan"
  },
  {
    id: "dbe:yakon",
    entityDefinitions: {
      kiColor: "yellow",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  },
  {
    id: "dbe:zarbon",
    entityDefinitions: {
      kiColor: "red",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    },
    transformations: [
      {
        id: "final_form",
        multipliers: {
          dexterity: 1.4,
          ki_consume: 2,
          strength: 1.4,
          willpower: 1.4
        }
      }
    ]
  },
  {
    id: "dbe:whis"
  },
  {
    id: "dbe:zamasu",
    race: "glind",
    entityDefinitions: {
      kiColor: "purple",
      skills: [
        "aura_boost",
        "ki_blast",
        "rapid_movement"
      ]
    }
  }
];
export {
  entity_data
};
