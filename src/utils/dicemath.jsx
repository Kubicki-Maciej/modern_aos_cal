/**
 * Kalkulator prawdopodobieństw AoS 4th Edition
 */

// Parsuje wartość typu "3+" na liczbę
export function parseRoll(value) {
  if (!value) return null;
  const match = String(value).match(/(\d+)\+?/);
  if (match) return parseInt(match[1], 10);
  return null;
}

// Prawdopodobieństwo zdania rzutu X+
export function rollProbability(target) {
  if (!target || target <= 1) return 1.0;
  if (target > 6) return 0.0;
  return (7 - target) / 6;
}

// Parsuje ilość ataków - obsługuje "2D6", "D3+1", "3", "2D6+3" itd.
export function parseAttacks(atkStr) {
  if (!atkStr) return { avg: 0, min: 0, max: 0, display: "0" };

  const s = String(atkStr).trim().toUpperCase();

  // Proste liczby: "3"
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return { avg: n, min: n, max: n, display: s };
  }

  // Format: XDY+Z lub DY+Z lub XDY
  const diceMatch = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (diceMatch) {
    const numDice = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1;
    const dieSize = parseInt(diceMatch[2], 10);
    const modifier = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0;

    const min = numDice * 1 + modifier;
    const max = numDice * dieSize + modifier;
    const avg = numDice * ((1 + dieSize) / 2) + modifier;

    return {
      avg: Math.max(0, avg),
      min: Math.max(0, min),
      max: Math.max(0, max),
      display: atkStr,
    };
  }

  // Fallback
  const parsed = parseFloat(s);
  if (!isNaN(parsed)) {
    return { avg: parsed, min: parsed, max: parsed, display: s };
  }

  return { avg: 0, min: 0, max: 0, display: atkStr };
}

// Parsuje damage - identyczna logika jak ataki
export function parseDamage(dmgStr) {
  return parseAttacks(dmgStr);
}

// Parsuje rend: "-1" -> 1, "-2" -> 2, "" -> 0
export function parseRend(rendStr) {
  if (!rendStr || rendStr === "-") return 0;
  const match = String(rendStr).match(/-?(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Oblicza średni damage broni przeciw celowi z danym save'em
 *
 * @param {object} weapon - obiekt broni z Atk, Hit, Wound, Rend, Damage, Crit
 * @param {number} targetSave - save celu (np. 4 dla 4+)
 * @param {number} targetWard - ward celu (np. 6 dla 6+, null jeśli brak)
 * @param {number} modelCount - ilość modeli atakujących
 * @returns {object} - szczegółowe wyniki
 */
export function calculateDamage(
  weapon,
  targetSave = 4,
  targetWard = null,
  modelCount = 1,
) {
  const attacks = parseAttacks(weapon.Atk);
  const hitTarget = parseRoll(weapon.Hit);
  const woundTarget = parseRoll(weapon.Wound);
  const rend = parseRend(weapon.Rend);
  const damage = parseDamage(weapon.Damage);
  const critType = (weapon.Crit || "").toLowerCase().trim();

  if (!hitTarget || !woundTarget) {
    return {
      avgHits: 0,
      avgWounds: 0,
      avgUnsaved: 0,
      avgDamage: 0,
      avgDamageAfterWard: 0,
      details: "Brak danych Hit/Wound",
    };
  }

  const totalAttacks = attacks.avg * modelCount;
  const pHit = rollProbability(hitTarget);
  const pWound = rollProbability(woundTarget);

  // Crit na Hit (natural 6)
  const pCritHit = 1 / 6;
  const pNormalHit = pHit - pCritHit;

  let avgHits = totalAttacks * pHit;
  let avgWounds = 0;
  let bonusCritDamage = 0;

  // AoS 4th crit keywords
  if (critType.includes("auto-wound") || critType.includes("autowound")) {
    // 6 na hit = automatyczny wound
    const autoWounds = totalAttacks * pCritHit;
    const normalHits = totalAttacks * Math.max(0, pNormalHit);
    const normalWounds = normalHits * pWound;
    avgWounds = autoWounds + normalWounds;
  } else if (critType.includes("2 hits") || critType.includes("2hit")) {
    // 6 na hit = 2 hity
    avgHits = totalAttacks * (pNormalHit + pCritHit * 2);
    avgWounds = avgHits * pWound;
  } else {
    avgWounds = avgHits * pWound;
  }

  // Mortal damage on crit
  if (critType.includes("mortal")) {
    // Dodatkowy mortal damage na crit wound (nat 6 to wound)
    const critWounds = avgHits * (1 / 6);
    bonusCritDamage = critWounds; // 1 mortal per crit
  }

  // Save celu (z uwzględnieniem rend)
  const effectiveSave = targetSave + rend;
  const pSave = effectiveSave <= 6 ? rollProbability(effectiveSave) : 0;
  const avgUnsaved = avgWounds * (1 - pSave);

  // Damage
  const avgDamage = avgUnsaved * damage.avg + bonusCritDamage;

  // Ward
  let avgDamageAfterWard = avgDamage;
  if (targetWard && targetWard >= 2 && targetWard <= 6) {
    const pWard = rollProbability(targetWard);
    avgDamageAfterWard = avgDamage * (1 - pWard);
  }

  return {
    totalAttacks: Math.round(totalAttacks * 100) / 100,
    avgHits: Math.round(avgHits * 100) / 100,
    avgWounds: Math.round(avgWounds * 100) / 100,
    avgUnsaved: Math.round(avgUnsaved * 100) / 100,
    avgDamage: Math.round(avgDamage * 100) / 100,
    avgDamageAfterWard: Math.round(avgDamageAfterWard * 100) / 100,
    effectiveSave: effectiveSave,
    rend: rend,
    damagePerAttack: damage.avg,
  };
}

/**
 * Generuje tabelę damage vs różne save'y
 */
export function generateDamageTable(weapon, modelCount = 1, targetWard = null) {
  const saves = [2, 3, 4, 5, 6, 7]; // 7 = no save
  const results = saves.map(save => ({
    save: save <= 6 ? `${save}+` : "None",
    saveValue: save,
    ...calculateDamage(weapon, save, targetWard, modelCount),
  }));
  return results;
}

/**
 * Generuje pełną tabelę: per-attack breakdown
 */
export function generateAttackBreakdown(
  weapon,
  targetSave = 4,
  modelCount = 1,
) {
  const attacks = parseAttacks(weapon.Atk);
  const hitTarget = parseRoll(weapon.Hit);
  const woundTarget = parseRoll(weapon.Wound);
  const rend = parseRend(weapon.Rend);
  const damage = parseDamage(weapon.Damage);

  if (!hitTarget || !woundTarget) return [];

  const totalAttacks = attacks.avg * modelCount;
  const effectiveSave = targetSave + rend;

  const steps = [];
  for (let i = 1; i <= Math.min(Math.ceil(totalAttacks), 30); i++) {
    const pHit = rollProbability(hitTarget);
    const pWound = rollProbability(woundTarget);
    const pSave = effectiveSave <= 6 ? rollProbability(effectiveSave) : 0;

    const hits = i * pHit;
    const wounds = hits * pWound;
    const unsaved = wounds * (1 - pSave);
    const dmg = unsaved * damage.avg;

    steps.push({
      attacks: i,
      hits: Math.round(hits * 100) / 100,
      wounds: Math.round(wounds * 100) / 100,
      unsaved: Math.round(unsaved * 100) / 100,
      damage: Math.round(dmg * 100) / 100,
    });
  }

  return steps;
}
