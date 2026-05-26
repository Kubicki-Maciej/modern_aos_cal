export function parseRollValue(value) {
  if (!value) return null;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function parseDiceValue(value) {
  if (!value) return 0;
  const s = String(value).trim().toUpperCase();

  if (/^\d+$/.test(s)) return parseInt(s, 10);

  const match = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (match) {
    const diceCount = match[1] ? parseInt(match[1], 10) : 1;
    const diceSize = parseInt(match[2], 10);
    const mod = match[3] ? parseInt(match[3], 10) : 0;
    return Math.max(0, diceCount * ((1 + diceSize) / 2) + mod);
  }

  return 0;
}

export function parseRendValue(value) {
  if (!value || value === "-") return 0;
  const match = String(value).match(/-?(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function normalizeCrit(value) {
  if (!value) return "";
  return String(value).trim().toLowerCase();
}

export function weaponToCalcProfile(weapon) {
  return {
    name: weapon.name || "Unknown weapon",
    range: weapon.Range || null,
    attacksRaw: weapon.Atk || "",
    attacks: parseDiceValue(weapon.Atk),
    hitRaw: weapon.Hit || "",
    hit: parseRollValue(weapon.Hit),
    woundRaw: weapon.Wound || "",
    wound: parseRollValue(weapon.Wound),
    rendRaw: weapon.Rend || "",
    rend: parseRendValue(weapon.Rend),
    damageRaw: weapon.Damage || "",
    damage: parseDiceValue(weapon.Damage),
    critRaw: weapon.Crit || "",
    crit: normalizeCrit(weapon.Crit),
  };
}

export function unitToCalcWeapons(unit) {
  if (!unit) return [];

  const melee = (unit.weapons?.melee || []).map(w => ({
    ...weaponToCalcProfile(w),
    type: "melee",
  }));

  const ranged = (unit.weapons?.ranged || []).map(w => ({
    ...weaponToCalcProfile(w),
    type: "ranged",
  }));

  return [...melee, ...ranged];
}
