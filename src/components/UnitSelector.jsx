import React, { useState } from "react";

export default function UnitSelector({
  units,
  selectedUnit,
  onSelect,
  factionName,
}) {
  const [search, setSearch] = useState("");

  const filtered = units.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Sortuj: po punktach malejąco
  const sorted = [...filtered].sort((a, b) => b.points - a.points);

  return (
    <div className="selector-panel unit-selector">
      <h2>🪖 Jednostki: {factionName}</h2>
      <input
        type="text"
        placeholder="Szukaj jednostki..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="search-input"
      />
      <div className="selector-list">
        {sorted.map((unit, idx) => (
          <button
            key={`${unit.name}-${idx}`}
            className={`selector-item ${selectedUnit?.name === unit.name ? "active" : ""}`}
            onClick={() => onSelect(unit)}
          >
            <span className="item-name">{unit.name}</span>
            <span className="item-badge">{unit.points} pts</span>
          </button>
        ))}
        {sorted.length === 0 && (
          <div className="no-results">Brak jednostek</div>
        )}
      </div>
    </div>
  );
}
