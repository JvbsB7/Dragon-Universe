const challenge_quests_data = [
  {
    id: "piccolo_trial",
    type: "challenge",
    objectives: [
      {
        duration: 600,
        tasks: [
          {
            type: "use_training_weight",
            item: "dbe:piccolo_cape"
          },
          {
            type: "consume_ki",
            amount: 50
          },
          {
            type: "defeat_enemy",
            entity: "dbe:piccolo_enemy",
            spawnOnStart: true,
            entityDefinitions: {
              friendlyDamage: true,
              powerDefinition: {
                level: 20,
                focus: {
                  constitution: 1,
                  dexterity: 2,
                  spirit: 1,
                  strength: 2,
                  willpower: 1.5
                }
              },
              availableTransformations: [
                "base",
                "full_released"
              ]
            }
          }
        ]
      }
    ],
    rewards: [
      {
        type: "skill",
        skill: "makankosappo"
      },
      {
        type: "points",
        pointType: "skill_points",
        amount: 1
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies"
      },
      {
        type: "zeni",
        amount: 10
      }
    ]
  },
  {
    id: "saibaman_challenge",
    type: "challenge",
    objectives: [
      {
        duration: 1200,
        restartCooldown: 6e3,
        dialogs: {
          on_start: 3
        },
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone"
          }
        ],
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:saibaman",
            count: 2,
            spawnOnStart: true
          }
        ]
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone"
          }
        ],
        duration: 1200,
        restartCooldown: 6e3,
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:saibaman",
            count: 4,
            spawnOnStart: true
          }
        ]
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone"
          }
        ],
        duration: 1200,
        restartCooldown: 6e3,
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:saibaman",
            count: 6,
            spawnOnStart: true
          }
        ]
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone"
          }
        ],
        duration: 1200,
        restartCooldown: 6e3,
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:saibaman",
            count: 8,
            spawnOnStart: true
          }
        ]
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone"
          }
        ],
        duration: 1200,
        restartCooldown: 6e3,
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:saibaman",
            count: 10,
            spawnOnStart: true
          }
        ]
      },
      {
        startRequirements: [
          {
            test: "in_biome",
            value: "dbe:dirtstone"
          }
        ],
        duration: 1200,
        restartCooldown: 6e3,
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:saibabrute",
            spawnOnStart: true
          }
        ]
      }
    ],
    rewards: [
      {
        type: "z_points",
        amountSource: "based_on_enemies"
      },
      {
        type: "zeni",
        amount: 10
      }
    ]
  },
  {
    id: "world_connections",
    type: "challenge",
    isHiddenActive: true,
    preDialogCount: 5,
    objectives: [
      {
        isRestartable: false,
        tasks: [
          { type: "interact_npc", entity: "dbe:beerus" },
          { type: "interact_npc", entity: "dbe:bulma" },
          { type: "interact_npc", entity: "dbe:cell_npc" },
          { type: "interact_npc", entity: "dbe:chi_chi" },
          { type: "interact_npc", entity: "dbe:enma_daioh" },
          { type: "interact_npc", entity: "dbe:goku" },
          { type: "interact_npc", entity: "dbe:kami_sama" },
          { type: "interact_npc", entity: "dbe:king_kai" },
          { type: "interact_npc", entity: "dbe:korin" },
          { type: "interact_npc", entity: "dbe:krillin" },
          { type: "interact_npc", entity: "dbe:master_roshi" },
          { type: "interact_npc", entity: "dbe:merchant" },
          { type: "interact_npc", entity: "dbe:mr_popo" },
          { type: "interact_npc", entity: "dbe:piccolo" },
          // { type: "interact_npc", entity: "dbe:porunga" },
          { type: "interact_npc", entity: "dbe:shenron" },
          { type: "interact_npc", entity: "dbe:unigame" },
          { type: "interact_npc", entity: "dbe:whis" }
        ]
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:akira_toriyama",
            dialogCount: 5
          }
        ]
      }
    ],
    rewards: [
      {
        type: "zeni",
        amount: 1955
      }
    ]
  }
];
export {
  challenge_quests_data
};
