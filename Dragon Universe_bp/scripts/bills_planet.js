/**
 * Bills' planet (dbe:bills_planet): one fixed build floating in its own space dimension.
 * The whole build is placed before the first arrival.
 *
 * Travel: Bills Invitation (dbe:bills_invitation, craftable): use it to go, use it again inside to return.
 *   /scriptevent dbe:bills_planet        -> go
 *   /scriptevent dbe:bills_planet_return -> go back
 *   /scriptevent dbe:bills_planet_rebuild -> place the build again (operators)
 */
import { createSpaceArena } from "./space_arena.js";

const X = -69, Y = 60, Z = -53;
const piece = (n, dx, dz, sx, sz) => ({ id: "dbe:bills_planet/bills_" + n, x: X + dx, y: Y, z: Z + dz, sx, sy: 134, sz });

createSpaceArena({
  label: "Bills' planet",
  dimId: "dbe:bills_planet",
  item: "dbe:bills_invitation",
  events: { go: "dbe:bills_planet", back: "dbe:bills_planet_return", rebuild: "dbe:bills_planet_rebuild" },
  spawn: { x: 0.5, y: 130, z: 1.5 }, // on the planks at build offset (69, 69, 54)
  fogTag: "dbe_bills_planet",
  originProp: "dbe:bills_origin",
  stateProp: "dbe:bills_planet_pieces",
  fallY: 20,
  pieces: [piece(1, 0, 0, 64, 64), piece(2, 0, 64, 64, 42), piece(3, 64, 0, 64, 64), piece(4, 64, 64, 64, 42), piece(5, 128, 0, 10, 64)],
  arrivalRadius: 1000,
  loadRadius: 1000,
});
