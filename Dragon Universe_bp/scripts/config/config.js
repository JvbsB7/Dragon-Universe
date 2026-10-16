const CONFIG = {
  /**
   * Valor máximo de cada atributo do jogador.
   */
  ATTRIBUTE_LIMIT: {
    constitution: 5e5,
    dexterity: 5e5,
    spirit: 5e5,
    strength: 5e5,
    willpower: 5e5,
  },
  /**
   * Preço de cada ponto de atributo.
   */
  ATTRIBUTE_COST: 1,
  /**
   * Esses itens são removidos automaticamente de containers
   * quando detectados pelo sistema de proteção.
   */
  BANNED_ITEMS: {
    ENABLED: true,
    ITEMS: [
      "minecraft:bundle",
      "minecraft:white_bundle",
      "minecraft:orange_bundle",
      "minecraft:magenta_bundle",
      "minecraft:light_blue_bundle",
      "minecraft:yellow_bundle",
      "minecraft:lime_bundle",
      "minecraft:pink_bundle",
      "minecraft:gray_bundle",
      "minecraft:light_gray_bundle",
      "minecraft:cyan_bundle",
      "minecraft:purple_bundle",
      "minecraft:blue_bundle",
      "minecraft:brown_bundle",
      "minecraft:green_bundle",
      "minecraft:red_bundle",
      "minecraft:black_bundle",
      "minecraft:undyed_shulker_box",
      "minecraft:white_shulker_box",
      "minecraft:orange_shulker_box",
      "minecraft:magenta_shulker_box",
      "minecraft:light_blue_shulker_box",
      "minecraft:yellow_shulker_box",
      "minecraft:lime_shulker_box",
      "minecraft:pink_shulker_box",
      "minecraft:gray_shulker_box",
      "minecraft:light_gray_shulker_box",
      "minecraft:cyan_shulker_box",
      "minecraft:purple_shulker_box",
      "minecraft:blue_shulker_box",
      "minecraft:brown_shulker_box",
      "minecraft:green_shulker_box",
      "minecraft:red_shulker_box",
      "minecraft:black_shulker_box",
    ],
  },
  /**
   * Tempo de recarga (ticks) para recarregar as tentativas do treino de concentração.
   */
  CONCENTRATION_COOLDOWN_TICKS: 24e3,
  /**
   * Configurações do sistema de proteção.
   */
  CLAIM: {
    FORBIDDEN_DIMENSIONS: [
      "dbe:angel_staff_dimension",
      "dbe:future_trunks",
      "dbe:hyperbolic_time_chamber",
      "dbe:other_world",
      "dbe:world_martial_arts_tournament",
    ],
  },
  /**
   * Configurações de fusões.
   */
  FUSION: {
    POTARA_FUSION_MULTIPLIER: 1,
    METAMORAN_FUSION_MULTIPLIER: 1.05,
  },
  /**
   * Blocos que não podem ser destruídos por ataques de Ki,
   * explosões ou outros sistemas de destruição do addon.
   * Inclui a Cápsula Hoi-Poi.
   */
  INDESTRUCTIBLE_BLOCKS: [
    "minecraft:air",
    "minecraft:allow",
    "minecraft:barrier",
    "minecraft:bedrock",
    "minecraft:border_block",
    "minecraft:chain_command_block",
    "minecraft:command_block",
    "minecraft:deny",
    "minecraft:end_gateway",
    "minecraft:end_portal",
    "minecraft:end_portal_frame",
    "minecraft:flowing_lava",
    "minecraft:flowing_water",
    "minecraft:jigsaw",
    "minecraft:lava",
    "minecraft:light_block_0",
    "minecraft:light_block_1",
    "minecraft:light_block_2",
    "minecraft:light_block_3",
    "minecraft:light_block_4",
    "minecraft:light_block_5",
    "minecraft:light_block_6",
    "minecraft:light_block_7",
    "minecraft:light_block_8",
    "minecraft:light_block_9",
    "minecraft:light_block_10",
    "minecraft:light_block_11",
    "minecraft:light_block_12",
    "minecraft:light_block_13",
    "minecraft:light_block_14",
    "minecraft:light_block_15",
    "minecraft:portal",
    "minecraft:repeating_command_block",
    "minecraft:structure_block",
    "minecraft:structure_void",
    "minecraft:water",
  ],
  /**
   * Configurações do sistema de níveis.
   */
  LEVEL: {
    INITIAL_LEVEL: 1,
    INITIAL_XP: 0,
    ATTRIBUTE_POINTS_PER_LEVEL: 7,
    SKILL_POINTS_PER_LEVEL: 1,
    XP_PER_LEVEL: 100,
  },
  /**
   * Multiplicadores de recompensa para diferentes ações.
   */
  REWARD_MODIFIERS: {
    DEFEAT_MOBS: 5,
    MASTERING: 0.1,
    QUEST_Z_POINTS: 5,
    TRAINING_WEIGHTS: 0.5,
  },
  /**
   * Configurações de sistemas para servidores.
   */
  SERVER_MODE: {
    BATTLE_POWER_RANKING: false,
    CLEAR_LAG: true,
    CUSTOM_CHAT: false,
  },
  /**
   * Tempo de recarga (ticks) para reutilizar Sombras de Treinamento.
   */
  SHADOW_DUMMY_COOLDOWN_TICKS: 30,
  /**
   * Configurações do sistema de estamina.
   */
  STAMINA: {
    ENABLED: true,
    COOLDOWN_TICKS: 5,
  },
};
export { CONFIG };
