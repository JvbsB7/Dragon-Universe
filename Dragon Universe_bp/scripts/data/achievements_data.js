const achievements_data = [
  {
    id: "after_future",
    revealRequirements: [
      {
        test: "is_race",
        value: "saiyan"
      }
    ],
    tasks: [
      {
        type: "requirement",
        requirement: {
          test: "has_skill",
          value: "ultra_instinct",
          level: 2
        }
      },
      {
        type: "requirement",
        requirement: {
          test: "is_skill_enabled",
          value: "ultra_instinct"
        }
      },
      {
        type: "requirement",
        requirement: {
          test: "is_transformation",
          raceId: "saiyan",
          value: "ssj4"
        }
      }
    ],
    rewards: [
      { type: "item", item: "dbe:goku_af_chestplate" },
      { type: "item", item: "dbe:goku_af_leggings" },
      { type: "item", item: "dbe:goku_af_boots" }
    ]
  },
  {
    id: "babidis_servant",
    tasks: [
      {
        type: "learn_skill",
        skill: "majin_mark"
      }
    ]
  },
  {
    id: "corrupted_heart",
    revealRequirements: [
      {
        test: "is_race",
        value: "saiyan"
      }
    ],
    tasks: [
      {
        type: "requirement",
        requirement: {
          test: "is_alignment",
          value: "evil"
        }
      },
      {
        type: "requirement",
        requirement: {
          test: "is_transformation",
          raceId: "saiyan",
          value: "ssjr"
        }
      }
    ],
    rewards: [
      { type: "item", item: "dbe:goku_black_chestplate" },
      { type: "item", item: "dbe:goku_black_leggings" },
      { type: "item", item: "dbe:goku_black_boots" }
    ]
  },
  {
    id: "demon_incarnate",
    revealRequirements: [
      {
        test: "is_alignment",
        value: "evil"
      }
    ],
    tasks: [
      {
        type: "requirement",
        requirement: {
          test: "has_skill",
          value: "legendary"
        }
      },
      {
        type: "requirement",
        requirement: {
          test: "is_alignment",
          value: "evil"
        }
      },
      {
        type: "defeat_enemy",
        entity: "minecraft:player",
        count: 4
      }
    ]
  },
  {
    id: "divine_power",
    tasks: [
      {
        type: "learn_skill",
        skill: "divine_ki"
      }
    ]
  },
  {
    id: "its_over_8000",
    tasks: [
      {
        type: "battle_power",
        amount: 8e3
      }
    ]
  },
  {
    id: "once_every_thousand_years",
    revealRequirements: [
      {
        test: "is_race",
        value: "saiyan"
      }
    ],
    tasks: [
      {
        type: "requirement",
        requirement: {
          test: "is_transformation",
          raceId: "saiyan",
          value: "ssj"
        }
      }
    ]
  },
  {
    id: "perfection",
    revealRequirements: [
      {
        test: "is_race",
        value: "bio_android"
      }
    ],
    tasks: [
      {
        type: "requirement",
        requirement: {
          test: "is_transformation",
          raceId: "bio_android",
          value: "perfect"
        }
      }
    ]
  },
  {
    id: "power_of_a_god",
    revealRequirements: [
      {
        test: "is_race",
        value: "saiyan"
      }
    ],
    tasks: [
      {
        type: "requirement",
        requirement: {
          test: "is_transformation",
          raceId: "saiyan",
          value: "ssjg"
        }
      },
      {
        type: "defeat_enemy",
        entity: "dbe:beerus_enemy"
      }
    ]
  },
  {
    id: "saiba_slayer",
    tasks: [
      {
        type: "defeat_enemy",
        entity: "dbe:saibaman",
        count: 700
      }
    ]
  },
  {
    id: "true_form",
    revealRequirements: [
      {
        test: "is_race",
        value: "frost_demon"
      }
    ],
    tasks: [
      {
        type: "requirement",
        requirement: {
          test: "is_transformation",
          raceId: "frost_demon",
          value: "fourth_form"
        }
      }
    ]
  }
];
export {
  achievements_data
};
