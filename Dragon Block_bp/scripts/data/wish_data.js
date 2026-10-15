const wish_data = [
  {
    type: "change_race",
    name: "earthling",
    availableIn: [
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "is_race",
        value: "earthling",
        operator: "!="
      }
    ]
  },
  {
    type: "change_race",
    name: "bio_android",
    availableIn: [
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "is_race",
        value: "bio_android",
        operator: "!="
      }
    ]
  },
  {
    type: "change_race",
    name: "frost_demon",
    availableIn: [
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "is_race",
        value: "frost_demon",
        operator: "!="
      }
    ]
  },
  {
    type: "change_race",
    name: "demon",
    availableIn: [
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "is_race",
        value: "demon",
        operator: "!="
      }
    ]
  },
  {
    type: "change_race",
    name: "glind",
    availableIn: [
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "is_race",
        value: "glind",
        operator: "!="
      }
    ]
  },
  {
    type: "change_race",
    name: "saiyan",
    availableIn: [
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "is_race",
        value: "saiyan",
        operator: "!="
      }
    ]
  },
  {
    type: "change_race",
    name: "namekian",
    availableIn: [
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "is_race",
        value: "namekian",
        operator: "!="
      }
    ]
  },
  {
    type: "change_race",
    name: "majin",
    availableIn: [
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "is_race",
        value: "majin",
        operator: "!="
      }
    ]
  },
  {
    name: "dbe:brave_sword",
    type: "item",
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "dbe:cooked_dinosaur_meat",
    type: "item",
    amount: 256,
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "dbe:cooked_giant_fish",
    type: "item",
    amount: 256,
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "dbe:evolitium_crystal",
    type: "item",
    amount: 64,
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "dbe:katchin_shard",
    type: "item",
    amount: 2,
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "dbe:potara_earrings",
    type: "item",
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "dbe:power_fruit",
    type: "item",
    single_use: true,
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "dbe:senzu_bean",
    type: "item",
    amount: 5,
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "minecraft:amethyst_shard",
    type: "item",
    amount: 16,
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "minecraft:diamond",
    type: "item",
    amount: 64,
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  },
  {
    name: "divine_ki",
    type: "skill",
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "has_skill",
        value: "divine_ki",
        operator: "!="
      }
    ]
  },
  {
    name: "potential_unleashed",
    type: "skill",
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "has_skill",
        value: "potential_unleashed",
        operator: "!="
      },
      {
        test: "is_race",
        value: "namekian"
      }
    ]
  },
  {
    name: "grow_tail",
    type: "tail",
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ],
    requirements: [
      {
        test: "has_modifier",
        value: "saiyan_tail",
        operator: "!="
      },
      {
        test: "is_race",
        value: "saiyan"
      }
    ]
  },
  {
    name: "minecraft:coal",
    type: "item",
    amount: 64,
    availableIn: [
      "dbe:shenron",
      "dbe:porunga"
    ]
  }
];
export {
  wish_data
};
