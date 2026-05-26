import React, { useState, useMemo } from "react";
import {
  generateDamageTable,
  calculateDamage,
  parseAttacks,
} from "../utils/dicemath";

export default function DamageSimulator({ unit }) {
  const [modelCount, setModelCount] = useState(1);
  const [targetWard, setTargetWard] = useState(0);
  const [selectedSave, setSelectedSave] = useState(4);

  const allWeapons = useMemo(() => {
    const weapons = [];
    if (unit.weapons?.melee) {
      unit.weapons.melee.forEach(w =>
        weapons.push({ ...w, category: "melee" }),
      );
    }
    if (unit.weapons?.ranged) {
      unit.weapons.ranged.forEach(w =>
        weapons.push({ ...w, category: "ranged" }),
      );
    }
    return weapons;
  }, [unit]);

  const damageData = useMemo(() => {
    return allWeapons.map(weapon => ({
      weapon,
      table: generateDamageTable(weapon, modelCount, targetWard || null),
      selected: calculateDamage(
        weapon,
        selectedSave,
        targetWard || null,
        modelCount,
      ),
    }));
  }, [allWeapons, modelCount, targetWard, selectedSave]);

  // Suma damage vs wybrany save
  const totalDamage = useMemo(() => {
    return damageData.reduce((sum, d) => sum + d.selected.avgDamage, 0);
  }, [damageData]);

  const totalDamageAfterWard = useMemo(() => {
    return damageData.reduce(
      (sum, d) => sum + d.selected.avgDamageAfterWard,
      0,
    );
  }, [damageData]);

  if (allWeapons.length === 0) {
    return (
      <div className="damage-simulator">
        <h3>📊 Damage Simulator</h3>
        <p className="no-data">Ta jednostka nie ma broni do symulacji</p>
      </div>
    );
  }

  return (
    <div className="damage-simulator">
      <h3>📊 Damage Simulator</h3>

      {/* Kontrolki */}
      <div className="sim-controls">
        <div className="control-group">
          <label>Modele atakujące:</label>
          <input
            type="number"
            min="1"
            max="40"
            value={modelCount}
            onChange={e =>
              setModelCount(Math.max(1, parseInt(e.target.value) || 1))
            }
          />
        </div>
        <div className="control-group">
          <label>Save celu:</label>
          <select
            value={selectedSave}
            onChange={e => setSelectedSave(parseInt(e.target.value))}
          >
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={5}>5+</option>
            <option value={6}>6+</option>
            <option value={7}>Brak save</option>
          </select>
        </div>
        <div className="control-group">
          <label>Ward celu:</label>
          <select
            value={targetWard}
            onChange={e => setTargetWard(parseInt(e.target.value))}
          >
            <option value={0}>Brak</option>
            <option value={4}>4+</option>
            <option value={5}>5+</option>
            <option value={6}>6+</option>
          </select>
        </div>
      </div>

      {/* Podsumowanie */}
      <div className="damage-summary">
        <div className="summary-card total">
          <div className="summary-value">
            {Math.round(totalDamage * 100) / 100}
          </div>
          <div className="summary-label">Średni DMG (łącznie)</div>
        </div>
        {targetWard > 0 && (
          <div className="summary-card ward">
            <div className="summary-value">
              {Math.round(totalDamageAfterWard * 100) / 100}
            </div>
            <div className="summary-label">Po Ward {targetWard}+</div>
          </div>
        )}
      </div>

      {/* Tabele per broń */}
      {damageData.map(({ weapon, table, selected }, idx) => (
        <div key={idx} className="weapon-sim-block">
          <h4>
            {weapon.category === "melee" ? "⚔️" : "🏹"} {weapon.name}
            <span className="weapon-profile-mini">
              {parseAttacks(weapon.Atk).display}A / {weapon.Hit} /{" "}
              {weapon.Wound} / {weapon.Rend || "-"} / {weapon.Damage}
            </span>
          </h4>

          {/* Breakdown wybranego save */}
          <div className="attack-pipeline">
            <div className="pipeline-step">
              <div className="pipe-value">{selected.totalAttacks}</div>
              <div className="pipe-label">Attacks</div>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <div className="pipe-value">{selected.avgHits}</div>
              <div className="pipe-label">Hits</div>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <div className="pipe-value">{selected.avgWounds}</div>
              <div className="pipe-label">Wounds</div>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <div className="pipe-value">{selected.avgUnsaved}</div>
              <div className="pipe-label">Unsaved</div>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step highlight">
              <div className="pipe-value">{selected.avgDamage}</div>
              <div className="pipe-label">Damage</div>
            </div>
          </div>

          {/* Tabela vs Save */}
          <div className="table-wrapper">
            <table className="damage-table">
              <thead>
                <tr>
                  <th>Target Save</th>
                  <th>Avg Hits</th>
                  <th>Avg Wounds</th>
                  <th>Unsaved</th>
                  <th>Avg Damage</th>
                  {targetWard > 0 && <th>After Ward</th>}
                </tr>
              </thead>
              <tbody>
                {table.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      row.saveValue === selectedSave ? "row-highlight" : ""
                    }
                  >
                    <td className="centered">{row.save}</td>
                    <td className="centered">{row.avgHits}</td>
                    <td className="centered">{row.avgWounds}</td>
                    <td className="centered">{row.avgUnsaved}</td>
                    <td className="centered highlight-dmg">{row.avgDamage}</td>
                    {targetWard > 0 && (
                      <td className="centered">{row.avgDamageAfterWard}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Damage bar chart */}
          <div className="damage-bars">
            {table.map((row, i) => {
              const maxDmg = Math.max(...table.map(r => r.avgDamage), 1);
              const width = (row.avgDamage / maxDmg) * 100;
              return (
                <div
                  key={i}
                  className={`bar-row ${row.saveValue === selectedSave ? "bar-highlight" : ""}`}
                >
                  <span className="bar-label">{row.save}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${width}%` }} />
                  </div>
                  <span className="bar-value">{row.avgDamage}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
