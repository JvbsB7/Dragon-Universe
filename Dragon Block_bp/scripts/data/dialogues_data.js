const dialogues_data = [
  {
    id: "akira_toriyama_main_menu",
    npcId: "dbe:akira_toriyama",
    title: "ui.dbe.npc.akira_toriyama.title",
    addQuest: {
      questId: "world_connections"
    },
    body: [
      {
        text: "ui.dbe.npc.akira_toriyama.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.akira_toriyama.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.akira_toriyama.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ]
  },
  {
    id: "babidi_main_menu",
    npcId: "dbe:babidi",
    title: "ui.dbe.npc.babidi.title",
    body: [
      {
        text: "ui.dbe.npc.babidi.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.babidi.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.babidi.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.babidi.main.button.skills",
        nextDialogue: "babidi_skills",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      }
    ],
    subMenus: [
      {
        id: "babidi_skills",
        backButtonDialogue: "babidi_main_menu",
        type: "skills"
      }
    ]
  },
  {
    id: "beerus_main_menu",
    npcId: "dbe:beerus",
    title: "ui.dbe.npc.beerus.title",
    body: [
      {
        text: "ui.dbe.npc.beerus.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.beerus.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.beerus.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.beerus.main.button.skills",
        nextDialogue: "beerus_skills"
      }
    ],
    requirements: [
      {
        test: "completed_quest",
        value: "saga_beerus_1"
      },
      {
        test: "has_skill",
        value: "divine_ki"
      }
    ],
    subMenus: [
      {
        id: "beerus_skills",
        backButtonDialogue: "beerus_main_menu",
        type: "skills"
      }
    ]
  },
  {
    id: "bulma_main_menu",
    npcId: "dbe:bulma",
    title: "ui.dbe.npc.bulma.title",
    body: [
      {
        text: "ui.dbe.npc.bulma.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.bulma.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.bulma.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.bulma.main.button.shop",
        nextDialogue: "bulma_shop",
        requirements: [
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil"
          }
        ]
      }
    ],
    subMenus: [
      {
        id: "bulma_shop",
        backButtonDialogue: "bulma_main_menu",
        type: "shop"
      }
    ]
  },
  {
    id: "capsule_corp_engineer_main_menu",
    npcId: "dbe:capsule_corp_engineer",
    title: "ui.dbe.npc.capsule_corp_engineer.title",
    body: [
      {
        text: "ui.dbe.npc.capsule_corp_engineer.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.capsule_corp_engineer.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.capsule_corp_engineer.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    addQuest: {
      questId: "android_conversion",
      requirements: [
        {
          test: "is_race",
          value: "earthling"
        },
        {
          test: "has_level",
          operator: ">=",
          value: 10
        }
      ]
    }
  },
  {
    id: "cell_main_menu",
    npcId: "dbe:cell_npc",
    title: "ui.dbe.npc.cell.title",
    body: [
      {
        text: "ui.dbe.npc.cell.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.cell.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.cell.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.cell.main.button.skills",
        nextDialogue: "cell_skills",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      }
    ],
    subMenus: [
      {
        id: "cell_skills",
        backButtonDialogue: "cell_main_menu",
        type: "skills"
      }
    ]
  },
  {
    id: "chi_chi_main_menu",
    npcId: "dbe:chi_chi",
    title: "ui.dbe.npc.chi_chi.title",
    body: [
      {
        text: "ui.dbe.npc.chi_chi.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.chi_chi.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.chi_chi.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.chi_chi.main.button.shop",
        nextDialogue: "chi_chi_shop",
        requirements: [
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil"
          }
        ]
      }
    ],
    subMenus: [
      {
        id: "chi_chi_shop",
        backButtonDialogue: "chi_chi_main_menu",
        type: "shop"
      }
    ]
  },
  {
    id: "king_kai_main_menu",
    npcId: "dbe:king_kai",
    title: "ui.dbe.npc.king_kai.title",
    body: [
      {
        text: "ui.dbe.npc.king_kai.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.king_kai.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.king_kai.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.king_kai.main.button.weight",
        nextDialogue: "weight",
        requirements: [
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil"
          }
        ]
      },
      {
        buttonText: "ui.dbe.npc.king_kai.main.button.skills",
        nextDialogue: "king_kai_skills",
        requirements: [
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil"
          }
        ]
      }
    ],
    subMenus: [
      {
        id: "weight",
        title: "ui.dbe.npc.king_kai.title",
        body: "ui.dbe.weight.text",
        backButtonDialogue: "king_kai_main_menu",
        buttons: [
          {
            buttonText: "ui.dbe.npc.king_kai.weight.button.catch",
            cooldown: {
              id: "training_weights",
              duration: 1200,
              source: "absolute_time"
            },
            rewards: [
              {
                type: "item",
                item: "dbe:workout_weights"
              }
            ]
          }
        ]
      },
      {
        id: "king_kai_skills",
        backButtonDialogue: "king_kai_main_menu",
        type: "skills"
      }
    ]
  },
  {
    id: "korin_main_menu",
    npcId: "dbe:korin",
    title: "ui.dbe.npc.korinMain.title",
    body: [
      {
        text: "ui.dbe.npc.korin.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.korin.main.text.fish",
        requirements: [
          {
            test: "has_quest",
            value: "bring_fish_for_karin"
          }
        ]
      },
      {
        text: "ui.dbe.npc.korin.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.korin.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    addQuest: {
      questId: "bring_fish_for_karin",
      requirements: [
        {
          test: "is_alignment",
          operator: "!=",
          value: "evil"
        }
      ]
    },
    buttons: [
      {
        buttonText: "ui.dbe.npc.korin.main.button.senzu_bean",
        cooldown: {
          id: "senzu_bean_daily",
          duration: 24e3,
          source: "absolute_time"
        },
        requirements: [
          {
            test: "completed_quest",
            value: "bring_fish_for_karin"
          },
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil"
          }
        ],
        rewards: [
          {
            type: "item",
            item: "dbe:senzu_bean"
          }
        ]
      },
      {
        buttonText: "ui.dbe.npc.korin.main.button.flying_nimbus",
        cooldown: {
          id: "flying_nimbus_daily",
          duration: 24e3,
          source: "absolute_time"
        },
        requirements: [
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil"
          },
          {
            test: "completed_quest",
            value: "bring_fish_for_karin"
          }
        ],
        rewards: [
          {
            type: "item",
            item: "dbe:flying_nimbus"
          }
        ]
      },
      {
        buttonText: "ui.dbe.npc.korin.main.button.flying_nimbus",
        cooldown: {
          id: "flying_nimbus_daily",
          duration: 24e3,
          source: "absolute_time"
        },
        requirements: [
          {
            test: "is_alignment",
            operator: "!=",
            value: "neutral"
          },
          {
            test: "is_alignment",
            operator: "!=",
            value: "good"
          },
          {
            test: "completed_quest",
            value: "bring_fish_for_karin"
          }
        ],
        rewards: [
          {
            type: "item",
            item: "dbe:black_flying_nimbus"
          }
        ]
      }
    ]
  },
  {
    id: "krillin_main_menu",
    npcId: "dbe:krillin",
    title: "ui.dbe.npc.krillin.title",
    body: [
      {
        text: "ui.dbe.npc.krillin.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.krillin.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.krillin.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.krillin.main.button.skills",
        nextDialogue: "krillin_skills"
      }
    ],
    subMenus: [
      {
        id: "krillin_skills",
        backButtonDialogue: "krillin_main_menu",
        type: "skills"
      }
    ]
  },
  {
    id: "master_roshi_main_menu",
    npcId: "dbe:master_roshi",
    title: "ui.dbe.npc.master_roshi.title",
    body: [
      {
        text: "ui.dbe.npc.master_roshi.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.master_roshi.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.master_roshi.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    addQuest: {
      questId: "fetch_bulma_outfit",
      requirements: [
        {
          test: "is_alignment",
          operator: "!=",
          value: "evil"
        }
      ]
    },
    buttons: [
      {
        buttonText: "ui.dbe.npc.master_roshi.main.button.weight",
        nextDialogue: "weight",
        requirements: [
          {
            test: "completed_quest",
            value: "fetch_bulma_outfit"
          },
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil"
          }
        ]
      },
      {
        buttonText: "ui.dbe.npc.master_roshi.main.button.skills",
        nextDialogue: "master_roshi_skills",
        requirements: [
          {
            test: "completed_quest",
            value: "fetch_bulma_outfit"
          },
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil"
          }
        ]
      }
    ],
    subMenus: [
      {
        id: "weight",
        title: "ui.dbe.npc.master_roshi.title",
        body: "ui.dbe.weight.text",
        backButtonDialogue: "master_roshi_main_menu",
        buttons: [
          {
            buttonText: "ui.dbe.npc.master_roshi.weight.button.catch",
            cooldown: {
              id: "training_weights",
              duration: 1200,
              source: "absolute_time"
            },
            rewards: [
              {
                type: "item",
                item: "dbe:turtle_shell"
              }
            ]
          }
        ]
      },
      {
        id: "master_roshi_skills",
        backButtonDialogue: "master_roshi_main_menu",
        type: "skills"
      }
    ]
  },
  {
    id: "merchant_main_menu",
    npcId: "dbe:merchant",
    title: "ui.dbe.npc.merchant.title",
    body: [
      {
        text: "ui.dbe.npc.merchant.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.merchant.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.merchant.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.merchant.main.button.clothing_shop",
        nextDialogue: "clothing_shop"
      }
    ],
    subMenus: [
      {
        id: "clothing_shop",
        backButtonDialogue: "merchant_main_menu",
        type: "shop"
      }
    ]
  },
  {
    id: "mr_popo_main_menu",
    npcId: "dbe:mr_popo",
    title: "ui.dbe.npc.mr_popo.title",
    body: [
      {
        text: "ui.dbe.npc.mr_popo.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.mr_popo.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.mr_popo.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.mr_popo.main.button.skills",
        nextDialogue: "mr_popo_skills",
        requirements: [
          {
            test: "is_alignment",
            operator: "!=",
            value: "evil"
          }
        ]
      }
    ],
    subMenus: [
      {
        id: "mr_popo_skills",
        backButtonDialogue: "mr_popo_main_menu",
        type: "skills"
      }
    ]
  },
  {
    id: "piccolo_main_menu",
    npcId: "dbe:piccolo",
    title: "ui.dbe.npc.piccolo.title",
    body: [
      {
        text: "ui.dbe.npc.piccolo.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.piccolo.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.piccolo.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.piccolo.main.button.weight",
        nextDialogue: "weight"
      },
      {
        buttonText: "ui.dbe.npc.piccolo.main.button.skills",
        nextDialogue: "piccolo_skills"
      }
    ],
    subMenus: [
      {
        id: "weight",
        title: "ui.dbe.npc.piccolo.title",
        body: "ui.dbe.weight.text",
        backButtonDialogue: "piccolo_main_menu",
        buttons: [
          {
            buttonText: "ui.dbe.npc.piccolo.weight.button.catch",
            cooldown: {
              id: "training_weights",
              duration: 1200,
              source: "absolute_time"
            },
            rewards: [
              {
                type: "item",
                item: "dbe:piccolo_cape"
              }
            ]
          }
        ]
      },
      {
        id: "piccolo_skills",
        backButtonDialogue: "piccolo_main_menu",
        type: "skills"
      }
    ]
  },
  {
    id: "vegeta_main_menu",
    npcId: "dbe:vegeta_npc",
    title: "ui.dbe.npc.vegeta.title",
    body: [
      {
        text: "ui.dbe.npc.vegeta.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.vegeta.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.vegeta.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    buttons: [
      {
        buttonText: "ui.dbe.npc.vegeta.main.button.skills",
        nextDialogue: "vegeta_skills"
      }
    ],
    subMenus: [
      {
        id: "vegeta_skills",
        backButtonDialogue: "vegeta_main_menu",
        type: "skills"
      }
    ]
  },
  {
    id: "unigame_main_menu",
    npcId: "dbe:unigame",
    title: "ui.dbe.npc.unigame.title",
    addQuest: {
      questId: "pirate_robot_treasure",
      requirements: [
        {
          test: "is_alignment",
          operator: "!=",
          value: "evil"
        }
      ]
    },
    body: [
      {
        text: "ui.dbe.npc.unigame.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.unigame.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.unigame.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ]
  },
  {
    id: "whis_main_menu",
    npcId: "dbe:whis",
    title: "ui.dbe.npc.whis.title",
    body: [
      {
        text: "ui.dbe.npc.whis.main.text.evil",
        requirements: [
          {
            test: "is_alignment",
            value: "evil"
          }
        ]
      },
      {
        text: "ui.dbe.npc.whis.main.text.neutral",
        requirements: [
          {
            test: "is_alignment",
            value: "neutral"
          }
        ]
      },
      {
        text: "ui.dbe.npc.whis.main.text.good",
        requirements: [
          {
            test: "is_alignment",
            value: "good"
          }
        ]
      }
    ],
    addQuest: {
      questId: "whis_ramen_delivery"
    },
    buttons: [
      {
        buttonText: "ui.dbe.npc.whis.main.button.weight",
        nextDialogue: "weight",
        requirements: [
          {
            test: "completed_quest",
            value: "whis_ramen_delivery"
          }
        ]
      },
      {
        buttonText: "ui.dbe.npc.whis.main.button.skills",
        nextDialogue: "whis_skills",
        requirements: [
          {
            test: "completed_quest",
            value: "whis_ramen_delivery"
          }
        ]
      }
    ],
    requirements: [
      {
        test: "completed_quest",
        value: "saga_beerus_1"
      },
      {
        test: "has_skill",
        value: "divine_ki"
      }
    ],
    subMenus: [
      {
        id: "weight",
        title: "ui.dbe.npc.whis.title",
        body: "ui.dbe.weight.text",
        backButtonDialogue: "whis_main_menu",
        buttons: [
          {
            buttonText: "ui.dbe.npc.whis.weight.button.catch",
            cooldown: {
              id: "training_weights",
              duration: 1200,
              source: "absolute_time"
            },
            rewards: [
              {
                type: "item",
                item: "dbe:training_armor"
              }
            ]
          }
        ]
      },
      {
        id: "whis_skills",
        backButtonDialogue: "whis_main_menu",
        type: "skills"
      }
    ]
  }
];
export {
  dialogues_data
};
