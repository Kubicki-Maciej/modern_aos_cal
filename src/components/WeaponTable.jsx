import React from "react";

export default function WeaponTable({ weapons, type }) {
  if (!weapons || weapons.length === 0) return null;

  const isMelee = type === "melee";
  const icon = isMelee ? "⚔️" : "🏹";
  const title = isMelee ? "Broń Wręcz" : "Broń Dystansowa";

  return (
    <div className="weapon-section">
      <h3>
        {icon} {title}
      </h3>
      <div className="table-wrapper">
        <table className="weapon-table">
          <thead>
            <tr>
              <th>Nazwa</th>
              {!isMelee && <th>Zasięg</th>}
              <th>Atk</th>
              <th>Hit</th>
              <th>Wnd</th>
              <th>Rend</th>
              <th>Dmg</th>
              <th>Crit</th>
            </tr>
          </thead>
          <tbody>
            {weapons.map((w, idx) => (
              <tr key={idx}>
                <td className="weapon-name">{w.name}</td>
                {!isMelee && <td className="centered">{w.Range || "-"}</td>}
                <td className="centered highlight-atk">{w.Atk || "-"}</td>
                <td className="centered">{w.Hit || "-"}</td>
                <td className="centered">{w.Wound || "-"}</td>
                <td className="centered highlight-rend">{w.Rend || "-"}</td>
                <td className="centered highlight-dmg">{w.Damage || "-"}</td>
                <td className="centered crit-cell">{w.Crit || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
