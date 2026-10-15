const global_transformations_data = [
  {
    id: "ultimate_form",
    kiDrain: 0,
    auraProperties: {
      sparks: true,
      color: "#FFFFFF"
    },
    colorOverrides: {
      eyes: "#000000"
    },
    multipliers: {
      dexterity: 3.1,
      strength: 3.1,
      willpower: 3.1
    },
    raceColorOverrides: [
      {
        raceId: "majin",
        overrides: {
          eyes: "#ec8c8c"
        }
      }
    ],
    requirements: [
      {
        test: "has_level",
        operator: ">=",
        value: 60
      },
      {
        test: "has_skill",
        value: "potential_unleashed"
      }
    ]
  },
  {
    id: "beast",
    auraProperties: {
      sparks: true,
      color: "#FF1CF7"
    },
    colorOverrides: {
      eyes: "#ED100D",
      hair: "#EBE9EA"
    },
    multipliers: {
      dexterity: 4,
      ki_consume: 6,
      strength: 4,
      willpower: 4
    },
    raceColorOverrides: [
      {
        raceId: "majin",
        overrides: {
          eyes: "#740000"
        }
      }
    ],
    requirements: [
      {
        test: "has_level",
        operator: ">=",
        value: 110
      },
      {
        test: "has_skill",
        value: "potential_unleashed",
        level: 10
      }
    ]
  },
  {
    id: "ultra_ego",
    auraProperties: {
      kiBarColor: "purple",
      sparks: true,
      color: "#FA19FA"
    },
    colorOverrides: {
      eyes: "#E478A4",
      hair: "#470142"
    },
    multipliers: {
      dexterity: 3,
      ki_consume: 6,
      strength: 4.5,
      willpower: 4.5
    },
    requirements: [
      {
        test: "has_level",
        operator: ">=",
        value: 120
      },
      {
        test: "has_skill",
        value: "hakai"
      }
    ]
  }
];
export {
  global_transformations_data
};
