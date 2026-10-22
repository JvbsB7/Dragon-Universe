const masters_data = [
  {
    id: "dbe:goku",
    alignment: "good",
    teachings: [
      {
        trialQuest: {
          id: "goku_training_1",
          type: "mentor",
          mentorId: "dbe:goku",
          objectives: [
            {
              isRestartable: false,
              tasks: [
                {
                  type: "collect_item",
                  count: 5,
                  deliverToNpc: "dbe:goku",
                  item: "dbe:raw_dinosaur_meat",
                  removeItemsOnComplete: true
                }
              ]
            }
          ],
          rewards: [
            {
              type: "friendship_points",
              masterId: "dbe:goku",
              amount: 100
            }
          ]
        }
      },
      {
        trialQuest: {
          id: "goku_training_2",
          type: "mentor",
          mentorId: "dbe:goku",
          objectives: [
            {
              tasks: [
                {
                  type: "use_training_weight",
                  item: "dbe:training_shirt"
                },
                {
                  type: "defeat_enemy",
                  entity: "dbe:goku_enemy",
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
                        willpower: 3
                      }
                    },
                    availableTransformations: [
                      "base",
                      "ssj"
                    ]
                  }
                }
              ]
            }
          ],
          rewards: [
            {
              type: "friendship_points",
              masterId: "dbe:goku",
              amount: 100
            },
            {
              type: "points",
              pointType: "skill_points",
              amount: 1
            }
          ]
        }
      },
      {
        trialQuest: {
          id: "goku_training_3",
          type: "mentor",
          mentorId: "dbe:goku",
          objectives: [
            {
              isRestartable: false,
              tasks: [
                {
                  type: "ki_charge",
                  amount: 800
                },
                {
                  type: "consume_ki",
                  amount: 800
                }
              ]
            }
          ],
          rewards: [
            {
              type: "friendship_points",
              masterId: "dbe:goku",
              amount: 100
            },
            {
              type: "points",
              pointType: "skill_points",
              amount: 1
            }
          ]
        }
      },
      {
        trialQuest: {
          id: "goku_training_4",
          type: "mentor",
          mentorId: "dbe:goku",
          objectives: [
            {
              tasks: [
                {
                  type: "use_training_weight",
                  item: "dbe:training_shirt"
                },
                {
                  type: "defeat_enemy",
                  entity: "dbe:goku_enemy",
                  spawnOnStart: true,
                  entityDefinitions: {
                    friendlyDamage: true,
                    powerDefinition: {
                      level: 60,
                      focus: {
                        constitution: 1,
                        dexterity: 2,
                        spirit: 1,
                        strength: 2,
                        willpower: 3
                      }
                    },
                    availableTransformations: [
                      "ssj",
                      "ssj2",
                      "ssj3"
                    ]
                  }
                }
              ]
            }
          ],
          rewards: [
            { type: "item", item: "dbe:goku_chestplate" },
            { type: "item", item: "dbe:goku_leggings" },
            { type: "item", item: "dbe:goku_boots" },
            { type: "friendship_points", masterId: "dbe:goku", amount: 100 },
            { type: "points", pointType: "skill_points", amount: 1 },
            { type: "z_points", amountSource: "based_on_enemies" }
          ]
        }
      }
    ]
  }
];
export {
  masters_data
};
