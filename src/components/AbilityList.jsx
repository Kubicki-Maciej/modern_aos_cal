import React, { useState } from "react";

const ABILITY_ICONS = {
  "Ability (Passive)": "🔵",
  "Ability (Activated)": "🟠",
  Ability: "🟢",
  Spell: "🔮",
  Prayer: "🙏",
  "Spell (Activated)": "🔮",
  "Prayer (Activated)": "🙏",
};

export default function AbilityList({ abilities }) {
  const [expanded, setExpanded] = useState({});

  if (!abilities || abilities.length === 0) return null;

  const toggle = idx => {
    setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="abilities-section">
      <h3>📜 Abilities</h3>
      <div className="abilities-list">
        {abilities.map((ability, idx) => {
          const icon = ABILITY_ICONS[ability.type] || "🟢";
          const isOpen = expanded[idx];

          return (
            <div
              key={idx}
              className={`ability-card ${isOpen ? "expanded" : ""}`}
            >
              <button className="ability-header" onClick={() => toggle(idx)}>
                <span className="ability-icon">{icon}</span>
                <span className="ability-name">{ability.name}</span>
                <span className="ability-type-badge">{ability.type}</span>
                <span className="ability-expand">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="ability-body">
                  {ability.keywords && (
                    <div className="ability-field">
                      <strong>Keywords:</strong>
                      <div className="keyword-tags">
                        {ability.keywords.split(",").map((kw, i) => (
                          <span key={i} className="keyword-tag">
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ability.casting_value && (
                    <div className="ability-field">
                      <strong>Casting Value:</strong> {ability.casting_value}
                    </div>
                  )}
                  {ability.chanting_value && (
                    <div className="ability-field">
                      <strong>Chanting Value:</strong> {ability.chanting_value}
                    </div>
                  )}
                  {ability.declare && (
                    <div className="ability-field">
                      <strong>Declare:</strong> {ability.declare}
                    </div>
                  )}
                  {ability.effect && (
                    <div className="ability-field">
                      <strong>Effect:</strong> {ability.effect}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
