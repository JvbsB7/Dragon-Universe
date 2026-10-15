const side_quests_data = [
  {
    id: "android_conversion",
    type: "side",
    preDialogCount: 3,
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "collect_item",
            count: 1,
            deliverToNpc: "dbe:capsule_corp_engineer",
            item: "dbe:nanochip",
            removeItemsOnComplete: true
          },
          {
            type: "collect_item",
            count: 2,
            deliverToNpc: "dbe:capsule_corp_engineer",
            item: "dbe:evolitium_crystal",
            removeItemsOnComplete: true
          },
          {
            type: "collect_item",
            count: 3,
            deliverToNpc: "dbe:capsule_corp_engineer",
            item: "minecraft:iron_ingot",
            removeItemsOnComplete: true
          }
        ]
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:capsule_corp_engineer",
            dialogCount: 3
          }
        ]
      }
    ],
    rewards: [
      {
        type: "race",
        race: "android"
      },
      {
        type: "zeni",
        amount: 10
      }
    ]
  },
  {
    id: "bring_fish_for_karin",
    type: "side",
    preDialogCount: 3,
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "collect_item",
            count: 5,
            deliverToNpc: "dbe:korin",
            item: "dbe:giant_fish",
            removeItemsOnComplete: true
          }
        ]
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:korin",
            dialogCount: 3
          }
        ]
      }
    ],
    rewards: [
      {
        type: "item",
        item: "dbe:sacred_water_flask"
      },
      {
        type: "zeni",
        amount: 5
      }
    ]
  },
  {
    id: "fetch_bulma_outfit",
    type: "side",
    preDialogCount: 3,
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "collect_item",
            deliverToNpc: "dbe:master_roshi",
            item: "dbe:bunny_costume_ears",
            removeItemsOnComplete: true
          }
        ]
      }
    ],
    rewards: [
      {
        type: "item",
        item: "dbe:power_pole"
      },
      {
        type: "zeni",
        amount: 15
      }
    ]
  },
  {
    id: "pirate_robot_treasure",
    type: "side",
    preDialogCount: 3,
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "enter_biome",
            dimensionId: "minecraft:overworld",
            biomeId: "minecraft:beach"
          }
        ]
      },
      {
        dialogs: {
          on_finish: 3
        },
        tasks: [
          {
            type: "defeat_enemy",
            entity: "dbe:pirate_robot",
            spawnOnStart: true
          }
        ]
      }
    ],
    rewards: [
      {
        type: "item",
        item: "dbe:pirate_robot_head"
      },
      {
        type: "item",
        item: "dbe:katana"
      },
      {
        type: "item",
        item: "dbe:nanochip",
        amount: 2
      },
      {
        type: "item",
        item: "dbe:evolitium_crystal",
        amount: 6
      },
      {
        type: "item",
        item: "minecraft:iron_ingot",
        amount: 8
      },
      {
        type: "z_points",
        amountSource: "based_on_enemies"
      },
      {
        type: "zeni",
        amountSource: "based_on_enemies"
      },
      {
        type: "zeni",
        amount: 10
      }
    ]
  },
  {
    id: "whis_ramen_delivery",
    type: "side",
    preDialogCount: 4,
    objectives: [
      {
        isRestartable: false,
        tasks: [
          {
            type: "collect_item",
            count: 2,
            deliverToNpc: "dbe:whis",
            item: "dbe:ramen",
            removeItemsOnComplete: true
          }
        ]
      },
      {
        isRestartable: false,
        tasks: [
          {
            type: "interact_npc",
            entity: "dbe:whis",
            dialogCount: 3
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
  }
];
export {
  side_quests_data
};
