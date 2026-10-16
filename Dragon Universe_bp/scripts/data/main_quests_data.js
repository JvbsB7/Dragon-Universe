const main_quests_data = [
  {
    id: "visit_lookout",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        dialogs: {
          on_start: 3,
        },
        tasks: [
          {
            type: "enter_region",
            region: "lookout",
            waypointTexture: "textures/ui/region_icons/lookout",
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_region",
            region: "korin_tower",
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:korin",
            dialogCount: 3,
          },
        ],
      },
    ],
    rewards: [
      {
        type: "zeni",
        amount: 10,
      },
    ],
  },
  {
    id: "saga_saiyan_1",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:piccolo",
            dialogCount: 3,
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "minecraft:overworld",
            biomeId: "dbe:dirtstone",
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:raditz",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 16,
                focus: {
                  constitution: 1,
                  dexterity: 0.8,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "give_quest",
        quest: "piccolo_trial",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_saiyan_2",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "learn_skill",
            skill: "fly",
            requirements: [
              {
                test: "has_skill",
                value: "fly",
                operator: "!=",
              },
            ],
          },
        ],
      },
      {
        isRestartable: false,
        teleportOnFinish: "other_world",
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:kami_sama",
            dialogCount: 3,
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:enma_daioh",
            dialogCount: 3,
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "requirement",
            requirement: {
              test: "is_skill_enabled",
              value: "fly",
            },
            requirements: [
              {
                test: "is_skill_enabled",
                operator: "!=",
                value: "fly",
              },
            ],
          },
          {
            type: "enter_region",
            region: "king_kai_planet",
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:king_kai",
            dialogCount: 3,
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "use_training_weight",
            item: "dbe:workout_weights",
          },
          {
            type: "defeat_enemy",
            entity: "dbe:shadow_dummy",
            count: 4,
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:king_kai",
            dialogCount: 3,
          },
        ],
      },
      {
        isRestartable: false,
        teleportOnStart: "lookout",
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:kami_sama",
            dialogCount: 3,
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_saiyan_3",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "minecraft:overworld",
            biomeId: "dbe:dirtstone",
          },
        ],
      },
      {
        isRestartable: false,
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:saibaman",
            count: 2,
            spawnOnStart: true,
          },
        ],
      },
      {
        isRestartable: false,
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:saibaman",
            count: 4,
            spawnOnStart: true,
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "give_quest",
        quest: "saibaman_challenge",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_saiyan_4",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:nappa",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 17,
                focus: {
                  constitution: 1.1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_saiyan_5",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:vegeta",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 22,
                focus: {
                  constitution: 1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1.1,
                  willpower: 1.1,
                },
              },
              availableTransformations: ["base", "oozaru"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_1",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        dialogs: {
          on_start: 4,
        },
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "dbe:namek",
            biomeId: "dbe:namek",
          },
        ],
      },
      {
        dialogs: {
          on_start: 2,
        },
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza_soldier",
            count: 2,
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 18,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 0.8,
                },
              },
            },
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza_soldier",
            count: 4,
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 18,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 0.8,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_2",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:cui",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 23,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_3",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:dodoria",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 23,
                focus: {
                  constitution: 1.1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_4",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:zarbon",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 24,
                focus: {
                  constitution: 1,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1.2,
                  willpower: 1,
                },
              },
              availableTransformations: ["base", "final_form"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_5",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:guldo",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 20,
                focus: {
                  constitution: 0.9,
                  dexterity: 0.9,
                  spirit: 1,
                  strength: 0.9,
                  willpower: 1.1,
                },
              },
            },
          },
          {
            type: "defeat_enemy",
            entity: "dbe:recoome",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 26,
                focus: {
                  constitution: 1.2,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1.2,
                  willpower: 1,
                },
              },
              availableTransformations: ["base", "buffed"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_6",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:burter",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 27,
                focus: {
                  constitution: 1,
                  dexterity: 1.4,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:jeice",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 27,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_7",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:ginyu",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 30,
                focus: {
                  constitution: 1,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1.2,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_8",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 35,
                focus: {
                  constitution: 1,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1.2,
                  willpower: 1.2,
                },
              },
              availableTransformations: [
                "base",
                "second_form",
                "third_form",
                "fourth_form",
              ],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_9",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:namek",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 35,
                focus: {
                  constitution: 1,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1.2,
                  willpower: 1.2,
                },
              },
              availableTransformations: ["full_power"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_10",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "minecraft:overworld",
            biomeId: "dbe:dirtstone",
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza_soldier",
            count: 1,
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 24,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 0.8,
                },
              },
            },
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza_soldier",
            count: 2,
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 24,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 0.8,
                },
              },
            },
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza_soldier",
            count: 3,
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 24,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 0.8,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_11",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:king_cold",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 36,
                focus: {
                  constitution: 1.2,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1.1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_frieza_12",
    type: "main",
    objectives: [
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 36,
                focus: {
                  constitution: 1,
                  dexterity: 0.9,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
              availableTransformations: ["mecha_frieza"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_android_1",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_region",
            region: "hyperbolic_time_chamber",
          },
          {
            type: "defeat_enemy",
            entity: "dbe:shadow_dummy",
            count: 2,
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_android_2",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:android_19",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 38,
                focus: {
                  constitution: 1.1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1.1,
                },
              },
              availableTransformations: ["base", "buffed"],
            },
          },
        ],
      },
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:android_20",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 38,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1.1,
                },
              },
              availableTransformations: ["base", "buffed"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_android_3",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:android_17",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 40,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1.3,
                  willpower: 1.3,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_android_4",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:android_18",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 42,
                focus: {
                  constitution: 1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1.3,
                  willpower: 1.3,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_android_5",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:cell",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 50,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1.1,
                  willpower: 1,
                },
              },
              availableTransformations: ["base", "semi_perfect"],
            },
          },
        ],
      },
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:cell_junior",
            count: 4,
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 20,
                focus: {
                  constitution: 1,
                  dexterity: 1.5,
                  spirit: 1,
                  strength: 1.3,
                  willpower: 1,
                },
              },
              availableTransformations: ["perfect"],
            },
          },
        ],
      },
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:cell",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 52,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1.1,
                  willpower: 1,
                },
              },
              availableTransformations: [
                "perfect",
                "full_power",
                "super_perfect",
              ],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_majin_1",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:puipui",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 50,
                focus: {
                  constitution: 1,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_majin_2",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:yakon",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 56,
                focus: {
                  constitution: 1,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1,
                  willpower: 1.3,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_majin_3",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:dabura",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 58,
                focus: {
                  constitution: 1,
                  dexterity: 1.6,
                  spirit: 1,
                  strength: 1.4,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_majin_4",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:majin_vegeta",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 59,
                focus: {
                  constitution: 1,
                  dexterity: 1.4,
                  spirit: 1,
                  strength: 1,
                  willpower: 1.3,
                },
              },
              availableTransformations: ["ssj2"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_majin_5",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:fat_buu",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 62,
                focus: {
                  constitution: 1.5,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_majin_6",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:super_buu",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 65,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
              availableTransformations: [
                "base",
                "super_buu_gohan",
                "super_buu_gotenks",
              ],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_majin_7",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "dbe:kai",
            biomeId: "dbe:kai",
          },
        ],
      },
      {
        autoStart: false,
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:kai",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:kid_buu",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 70,
                focus: {
                  constitution: 1,
                  dexterity: 1.3,
                  spirit: 1,
                  strength: 1.4,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_beerus_1",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:whis",
            dialogCount: 2,
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "learn_skill",
            skill: "divine_ki",
            requirements: [
              {
                test: "has_skill",
                value: "divine_ki",
                operator: "!=",
              },
            ],
          },
        ],
      },
      {
        autoStart: false,
        completeOnTimeout: true,
        duration: 600,
        dialogs: {
          on_finish: 2,
        },
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:beerus_enemy",
            spawnOnStart: true,
            entityDefinitions: {
              alwaysDodge: true,
              friendlyDamage: true,
              powerDefinition: {
                level: 400,
                focus: {
                  constitution: 1,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1.2,
                  willpower: 1.1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_golden_frieza_1",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:shadow_dummy",
            count: 6,
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_golden_frieza_2",
    type: "main",
    objectives: [
      {
        restartCooldown: 600,
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza_soldier",
            count: 3,
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 30,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 0.8,
                },
              },
            },
          },
        ],
      },
      {
        restartCooldown: 600,
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza_soldier",
            count: 6,
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 40,
                focus: {
                  constitution: 1,
                  dexterity: 1,
                  spirit: 1,
                  strength: 1,
                  willpower: 0.8,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_golden_frieza_3",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:shisami",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 80,
                focus: {
                  constitution: 1.2,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:tagoma",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 82,
                focus: {
                  constitution: 1,
                  dexterity: 1.2,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_golden_frieza_4",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frieza",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 98,
                focus: {
                  constitution: 1.2,
                  dexterity: 1.3,
                  spirit: 1,
                  strength: 1.1,
                  willpower: 1,
                },
              },
              availableTransformations: ["base", "fourth_form", "golden_form"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_universe_6_1",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:piccolo",
            dialogCount: 3,
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "dbe:universe_6_arena",
            biomeId: "dbe:universe_6_arena",
          },
        ],
      },
      {
        autoStart: false,
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:universe_6_arena",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:piccolo_enemy",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 75,
                focus: {
                  constitution: 1,
                  dexterity: 2,
                  spirit: 1,
                  strength: 2,
                  willpower: 1.5,
                },
              },
              availableTransformations: ["base", "full_released"],
            },
          },
        ],
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:goku",
            dialogCount: 3,
          },
        ],
      },
      {
        autoStart: false,
        dialogs: {
          on_finish: 1,
        },
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:universe_6_arena",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:goku_enemy",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 98,
                focus: {
                  constitution: 1,
                  dexterity: 2,
                  spirit: 1,
                  strength: 2,
                  willpower: 1.5,
                },
              },
              availableTransformations: [
                "base",
                "ssj",
                "ssj2",
                "ssj3",
                "ssjg",
                "ssjb",
              ],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_universe_6_2",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "dbe:universe_6_arena",
            biomeId: "dbe:universe_6_arena",
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:universe_6_arena",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:botamo",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 97,
                focus: {
                  constitution: 1.1,
                  dexterity: 0.8,
                  spirit: 1,
                  strength: 0.8,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_universe_6_3",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "dbe:universe_6_arena",
            biomeId: "dbe:universe_6_arena",
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:universe_6_arena",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:frost",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 100,
                focus: {
                  constitution: 1.1,
                  dexterity: 0.8,
                  spirit: 1,
                  strength: 0.8,
                  willpower: 1,
                },
              },
              availableTransformations: [
                "base",
                "second_form",
                "third_form",
                "fourth_form",
              ],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_universe_6_4",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "dbe:universe_6_arena",
            biomeId: "dbe:universe_6_arena",
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:universe_6_arena",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:magetta",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 101,
                focus: {
                  constitution: 1.1,
                  dexterity: 0.8,
                  spirit: 1,
                  strength: 0.8,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_universe_6_5",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "dbe:universe_6_arena",
            biomeId: "dbe:universe_6_arena",
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:universe_6_arena",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:cabba",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 90,
                focus: {
                  constitution: 1.1,
                  dexterity: 0.8,
                  spirit: 1,
                  strength: 0.8,
                  willpower: 1,
                },
              },
              availableTransformations: ["base", "ssj"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_universe_6_6",
    type: "main",
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "dbe:universe_6_arena",
            biomeId: "dbe:universe_6_arena",
          },
        ],
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:universe_6_arena",
          },
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:hitto",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 105,
                focus: {
                  constitution: 1.1,
                  dexterity: 1.5,
                  spirit: 1,
                  strength: 0.8,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amount: 25,
      },
    ],
  },
  {
    id: "saga_future_trunks_1",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "collect_item",
            item: "dbe:nanochip",
            deliverToNpc: "dbe:bulma",
            count: 6,
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
    ],
  },
  {
    id: "saga_future_trunks_2",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:goku_black",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 102,
                focus: {
                  constitution: 1.1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
    ],
  },
  {
    id: "saga_future_trunks_3",
    type: "main",
    objectives: [
      {
        teleportOnFinish: "future_trunks",
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:bulma",
            dialogCount: 3,
          },
        ],
      },
      {
        dialogs: {
          on_start: 5,
        },
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:goku_black",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 125,
                focus: {
                  constitution: 1.1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
              availableTransformations: ["ssjg"],
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
    ],
  },
  {
    id: "saga_future_trunks_4",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:zamasu",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 136,
                focus: {
                  constitution: 1.1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
    ],
  },
  {
    id: "saga_future_trunks_5",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:fused_zamasu",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 159,
                focus: {
                  constitution: 1.1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
    ],
  },
  {
    id: "saga_future_trunks_6",
    type: "main",
    objectives: [
      {
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:corrupted_fused_zamasu",
            spawnOnStart: true,
            entityDefinitions: {
              powerDefinition: {
                level: 170,
                focus: {
                  constitution: 1.1,
                  dexterity: 1.1,
                  spirit: 1,
                  strength: 1,
                  willpower: 1,
                },
              },
            },
          },
        ],
      },
    ],
    rewards: [
      {
        type: "alignment_question",
        amountSource: "based_on_enemies",
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies",
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies",
      },
    ],
  },
];
export { main_quests_data };
