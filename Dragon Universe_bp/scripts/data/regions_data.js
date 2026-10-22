import { variables } from "./variables";
const regionsData = [
  {
    id: "future_trunks",
    dimensionId: "dbe:future_trunks",
    blockProtection: true,
    pos1: {
      x: -256,
      y: -64,
      z: -256
    },
    pos2: {
      x: 256,
      y: 320,
      z: 256
    },
    spawnLocation: {
      x: 0,
      y: 68,
      z: 0
    }
  },
  {
    id: "hyperbolic_time_chamber_exit_door",
    dimensionId: "dbe:hyperbolic_time_chamber",
    priority: -1,
    pos1: {
      x: -1,
      y: -60,
      z: -6
    },
    pos2: {
      x: 1,
      y: -58,
      z: -6
    }
  },
  {
    id: "hyperbolic_time_chamber_join_door",
    dimensionId: "minecraft:overworld",
    priority: -1,
    accessRequirements: {
      deniedAccessMessage: {
        translate: "region.hyperbolic_time_chamber.deniedAccess"
      },
      requirements: [
        {
          test: "completed_quest",
          value: "saga_frieza_12"
        }
      ],
      deniedAccessLocation: {
        x: 150,
        y: 300,
        z: 169
      }
    },
    pos1: {
      x: 149,
      y: 300,
      z: 170
    },
    pos2: {
      x: 151,
      y: 302,
      z: 170
    },
    spawnLocation: {
      x: 150,
      y: 300,
      z: 169
    }
  },
  {
    id: "hyperbolic_time_chamber",
    dimensionId: "dbe:hyperbolic_time_chamber",
    allowPvP: false,
    allowQuests: false,
    blockProtection: true,
    preventMobSpawning: true,
    pos1: {
      x: -64,
      y: -64,
      z: -64
    },
    pos2: {
      x: 64,
      y: 320,
      z: 64
    },
    spawnLocation: {
      x: 1,
      y: -60,
      z: -4
    }
  },
  {
    id: "king_kai_planet",
    dimensionId: "dbe:other_world",
    allowPvP: false,
    allowQuests: false,
    blockProtection: true,
    gravity: 1,
    preventMobSpawning: true,
    pos1: {
      x: -32,
      y: 0,
      z: -1032
    },
    pos2: {
      x: 32,
      y: 320,
      z: -968
    },
    spawnLocation: {
      x: 0,
      y: 136,
      z: -1e3
    }
  },
  {
    id: "korin_tower",
    dimensionId: "minecraft:overworld",
    allowPvP: false,
    allowQuests: false,
    blockProtection: true,
    preventMobSpawning: true,
    pos1: {
      x: 162,
      y: 219,
      z: 162
    },
    pos2: {
      x: 138,
      y: 239,
      z: 138
    },
    spawnLocation: {
      x: 154,
      y: 226,
      z: 144
    }
  },
  {
    id: "lookout",
    dimensionId: "minecraft:overworld",
    allowPvP: false,
    allowQuests: false,
    blockProtection: true,
    preventMobSpawning: true,
    pos1: {
      x: variables.lookoutLocation.x - 64,
      y: -64,
      z: variables.lookoutLocation.z - 64
    },
    pos2: {
      x: variables.lookoutLocation.x + 64,
      y: 320,
      z: variables.lookoutLocation.z + 64
    },
    spawnLocation: {
      x: 150.5,
      y: 299,
      z: 126.5
    }
  },
  {
    id: "other_world",
    dimensionId: "dbe:other_world",
    allowPvP: false,
    allowQuests: false,
    blockProtection: true,
    preventMobSpawning: true,
    pos1: {
      x: -2048,
      y: -64,
      z: -2048
    },
    pos2: {
      x: 2048,
      y: 320,
      z: 2048
    },
    spawnLocation: {
      x: 0,
      y: 65,
      z: 39
    }
  },
  {
    id: "world_martial_arts_tournament",
    dimensionId: "dbe:world_martial_arts_tournament",
    allowPvP: false,
    allowQuests: false,
    blockProtection: true,
    preventMobSpawning: true,
    pos1: {
      x: -64,
      y: -64,
      z: -64
    },
    pos2: {
      x: 64,
      y: 320,
      z: 64
    },
    spawnLocation: {
      x: 0,
      y: -60,
      z: 0
    }
  },
  {
    id: "world_martial_arts_tournament_arena",
    dimensionId: "dbe:world_martial_arts_tournament",
    allowPvP: true,
    allowQuests: false,
    blockProtection: true,
    preventMobSpawning: true,
    priority: 1,
    pos1: {
      x: 24,
      y: -60,
      z: 18
    },
    pos2: {
      x: -17,
      y: 320,
      z: 47
    }
  }
];
export {
  regionsData
};
