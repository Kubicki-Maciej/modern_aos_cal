import React, { useState } from "react";

export default function FactionSelector({
  factions,
  selectedFaction,
  onSelect,
}) {
  const [search, setSearch] = useState("");

  const filtered = factions.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="selector-panel faction-selector">
      <h2>⚔️ Wybierz Frakcję</h2>
      <input
        type="text"
        placeholder="Szukaj frakcji..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="search-input"
      />
      <div className="selector-list">
        {filtered.map(faction => (
          <button
            key={faction.name}
            className={`selector-item ${selectedFaction === faction.name ? "active" : ""}`}
            onClick={() => onSelect(faction.name)}
          >
            <span className="item-name">{faction.name}</span>
            <span className="item-badge">{faction.unitCount}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="no-results">Brak wyników</div>
        )}
      </div>
    </div>
  );
}
