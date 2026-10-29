const dragonBallsData = [
  {
    blockId: "dbe:dragon_ball",
    cooldown: 24e3,
    maxWishes: 3,
    requiredBalls: 7,
    sourceId: "dbe:shenron",
    spawnSound: "music.game.shenron_theme",
    spawnRules: [
      {
        dimensionId: "minecraft:overworld",
        spawnRadius: 4096
      }
    ]
  },
  {
    blockId: "dbe:namek_dragon_ball",
    cooldown: 24e3,
    maxWishes: 3,
    requiredBalls: 7,
    sourceAnimation: "animation.porunga.dialogue",
    sourceId: "dbe:porunga",
    spawnSound: "music.game.porunga_theme",
    // exact positions come from namekDragonBallSpot() in namek_dimension.js (spaced apart, on land)
    spawnRules: [
      {
        dimensionId: "dbe:namek",
        spawnRadius: 1200
      }
    ]
  }
];
export {
  dragonBallsData
};
