import { useMemo, useState } from "react";
import { unitToCalcWeapons } from "../utils/aoscalcAdapter";

function successChance(target) {
  if (!target) return 0;
  if (target <= 1) return 1;
  if (target > 6) return 0;
  return (7 - target) / 6;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function calculateWeapon(profile, targetSave, modelCount, ward = 0) {
  const totalAttacks = profile.attacks * modelCount;
  const hitChance = successChance(profile.hit);
  const woundChance = successChance(profile.wound);

  let avgHits = totalAttacks * hitChance;
  let avgWounds = avgHits * woundChance;

  // bardzo prosta obsługa critów - potem podmienimy na logikę z aoscalc
  if (profile.crit.includes("auto-wound")) {
    const critHits = totalAttacks * (1 / 6);
    const normalHits = totalAttacks * Math.max(0, hitChance - 1 / 6);
    avgWounds = critHits + normalHits * woundChance;
  }

  const effectiveSave = targetSave + Math.abs(profile.rend);
  const saveChance =
    effectiveSave >= 2 && effectiveSave <= 6 ? successChance(effectiveSave) : 0;

  const unsaved = avgWounds * (1 - saveChance);
  const damage = unsaved * profile.damage;

  let damageAfterWard = damage;
  if (ward >= 2 && ward <= 6) {
    const wardChance = successChance(ward);
    damageAfterWard = damage * (1 - wardChance);
  }

  return {
    attacks: round(totalAttacks),
    hits: round(avgHits),
    wounds: round(avgWounds),
    unsaved: round(unsaved),
    damage: round(damage),
    damageAfterWard: round(damageAfterWard),
  };
}

export default function AosCalcTable({ unit }) {
  const [modelCount, setModelCount] = useState(1);
  const [targetSave, setTargetSave] = useState(4);
  const [targetWard, setTargetWard] = useState(0);

  const weapons = useMemo(() => unitToCalcWeapons(unit), [unit]);

  if (!unit) return null;

  if (weapons.length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={styles.title}>Tabela obrażeń</h3>
        <p style={styles.muted}>Brak broni do pokazania</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Tabela obrażeń</h3>

      <div style={styles.controls}>
        <div>
          <label style={styles.label}>Modele</label>
          <input
            type="number"
            min="1"
            value={modelCount}
            onChange={e =>
              setModelCount(Math.max(1, parseInt(e.target.value || "1", 10)))
            }
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Save celu</label>
          <select
            value={targetSave}
            onChange={e => setTargetSave(parseInt(e.target.value, 10))}
            style={styles.input}
          >
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={5}>5+</option>
            <option value={6}>6+</option>
            <option value={7}>Brak</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>Ward celu</label>
          <select
            value={targetWard}
            onChange={e => setTargetWard(parseInt(e.target.value, 10))}
            style={styles.input}
          >
            <option value={0}>Brak</option>
            <option value={4}>4+</option>
            <option value={5}>5+</option>
            <option value={6}>6+</option>
          </select>
        </div>
      </div>

      {weapons.map((weapon, i) => {
        const current = calculateWeapon(
          weapon,
          targetSave,
          modelCount,
          targetWard,
        );
        const saveRows = [2, 3, 4, 5, 6, 7].map(save => ({
          save,
          result: calculateWeapon(weapon, save, modelCount, targetWard),
        }));

        return (
          <div key={i} style={styles.weaponBlock}>
            <h4 style={styles.weaponTitle}>
              {weapon.type === "melee" ? "⚔️" : "🏹"} {weapon.name}
            </h4>

            <div style={styles.profileRow}>
              <span>{weapon.attacksRaw} Atk</span>
              <span>{weapon.hitRaw} Hit</span>
              <span>{weapon.woundRaw} Wound</span>
              <span>{weapon.rendRaw || "-"} Rend</span>
              <span>{weapon.damageRaw} Dmg</span>
              <span>{weapon.critRaw || "-"} Crit</span>
            </div>

            <div style={styles.summary}>
              <div style={styles.summaryBox}>
                <strong>{current.attacks}</strong>
                <span>Attacks</span>
              </div>
              <div style={styles.summaryBox}>
                <strong>{current.hits}</strong>
                <span>Hits</span>
              </div>
              <div style={styles.summaryBox}>
                <strong>{current.wounds}</strong>
                <span>Wounds</span>
              </div>
              <div style={styles.summaryBox}>
                <strong>{current.unsaved}</strong>
                <span>Unsaved</span>
              </div>
              <div style={{ ...styles.summaryBox, borderColor: "#f59e0b" }}>
                <strong>
                  {targetWard ? current.damageAfterWard : current.damage}
                </strong>
                <span>{targetWard ? "Damage po Ward" : "Damage"}</span>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Save</th>
                    <th style={styles.th}>Hits</th>
                    <th style={styles.th}>Wounds</th>
                    <th style={styles.th}>Unsaved</th>
                    <th style={styles.th}>Damage</th>
                    {targetWard > 0 && <th style={styles.th}>After Ward</th>}
                  </tr>
                </thead>
                <tbody>
                  {saveRows.map(row => (
                    <tr
                      key={row.save}
                      style={
                        row.save === targetSave ? styles.activeRow : undefined
                      }
                    >
                      <td style={styles.td}>
                        {row.save === 7 ? "Brak" : `${row.save}+`}
                      </td>
                      <td style={styles.td}>{row.result.hits}</td>
                      <td style={styles.td}>{row.result.wounds}</td>
                      <td style={styles.td}>{row.result.unsaved}</td>
                      <td style={styles.td}>{row.result.damage}</td>
                      {targetWard > 0 && (
                        <td style={styles.td}>{row.result.damageAfterWard}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  card: {
    background: "#1a2535",
    border: "1px solid #334",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    margin: "0 0 12px",
    color: "#f5a623",
  },
  muted: {
    color: "#94a3b8",
  },
  controls: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  label: {
    display: "block",
    marginBottom: 6,
    color: "#cbd5e1",
    fontSize: 13,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#fff",
    minWidth: 110,
  },
  weaponBlock: {
    borderTop: "1px solid #334",
    paddingTop: 16,
    marginTop: 16,
  },
  weaponTitle: {
    margin: "0 0 8px",
  },
  profileRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    color: "#cbd5e1",
    fontSize: 13,
    marginBottom: 12,
  },
  summary: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  summaryBox: {
    minWidth: 100,
    background: "#0f172a",
    border: "1px solid #334",
    borderRadius: 8,
    padding: 10,
    display: "flex",
    flexDirection: "column",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    border: "1px solid #334",
    padding: 8,
    background: "#0f172a",
  },
  td: {
    border: "1px solid #334",
    padding: 8,
  },
  activeRow: {
    background: "#2d2410",
  },
};
