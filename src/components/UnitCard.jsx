import React from "react";
import StatBar from "./StatBar";
import WeaponTable from "./WeaponTable";
import AbilityList from "./AbilityList";
import DamageSimulator from "./DamageSimulator";

export default function UnitCard({ unit }) {
  if (!unit) return null;

  return (
    <div className="unit-card">
      {/* Header */}
      <div className="unit-header">
        <div className="unit-title-row">
          <h1 className="unit-name">{unit.name}</h1>
          <div className="unit-points">{unit.points} pts</div>
        </div>
        {unit.keywords && unit.keywords.length > 0 && (
          <div className="unit-keywords">
            {unit.keywords.map((kw, i) => (
              <span key={i} className="keyword-tag">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <StatBar stats={unit.stats} />

      {/* Weapons */}
      <WeaponTable weapons={unit.weapons?.ranged} type="ranged" />
      <WeaponTable weapons={unit.weapons?.melee} type="melee" />

      {/* Damage Simulator */}
      <DamageSimulator unit={unit} />

      {/* Abilities */}
      <AbilityList abilities={unit.abilities} />
    </div>
  );
}
