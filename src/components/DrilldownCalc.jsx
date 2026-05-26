import { useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  binomialDistribution,
  parseRollToProb,
  parseRend,
  parseAttacks,
  parseDamage,
} from "../utils/binomial";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

/* ═══════ USTAWIENIA WYGLĄDU ═══════ */

const COLORS = {
  hit: { bg: "rgba(74, 158, 255, 0.7)", border: "#4a9eff" },
  wound: { bg: "rgba(255, 140, 74, 0.7)", border: "#ff8c4a" },
  save: { bg: "rgba(74, 255, 139, 0.7)", border: "#4aff8b" },
  damage: { bg: "rgba(245, 166, 35, 0.7)", border: "#f5a623" },
  selected: { bg: "rgba(245, 166, 35, 0.9)", border: "#f5a623" },
};

const S = {
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
    fontSize: 18,
  },
  subtitle: {
    margin: "16px 0 8px",
    color: "#ccc",
    fontSize: 15,
  },
  controls: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  controlGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: "#889",
    textTransform: "uppercase",
  },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #445",
    background: "#0a1018",
    color: "#eee",
    fontSize: 14,
    width: 100,
  },
  select: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #445",
    background: "#0a1018",
    color: "#eee",
    fontSize: 14,
    width: 100,
  },
  weaponBtn: active => ({
    padding: "8px 14px",
    borderRadius: 6,
    border: active ? "2px solid #f5a623" : "1px solid #445",
    background: active ? "#2a1f0a" : "#131c28",
    color: "#eee",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? "bold" : "normal",
  }),
  chartWrap: {
    background: "#131c28",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    border: "1px solid #334",
    position: "relative",
    cursor: "pointer",
  },
  breadcrumb: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  crumb: active => ({
    padding: "4px 10px",
    borderRadius: 99,
    background: active ? "#f5a623" : "#334",
    color: active ? "#000" : "#ccc",
    fontSize: 12,
    fontWeight: active ? "bold" : "normal",
    cursor: "pointer",
    border: "none",
  }),
  backBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid #445",
    background: "#0a1018",
    color: "#f5a623",
    cursor: "pointer",
    fontSize: 13,
    marginBottom: 12,
  },
  infoBox: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  infoPill: color => ({
    background: "#0a1018",
    border: `1px solid ${color}`,
    borderRadius: 8,
    padding: "8px 14px",
    textAlign: "center",
  }),
  infoPillVal: {
    fontSize: 18,
    fontWeight: "bold",
    display: "block",
    color: "#eee",
  },
  infoPillLbl: {
    fontSize: 11,
    color: "#889",
  },
  hint: {
    color: "#667",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  dmgTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 12,
  },
  th: {
    textAlign: "left",
    padding: 8,
    border: "1px solid #334",
    background: "#0a1018",
    fontSize: 13,
    color: "#f5a623",
  },
  td: {
    padding: 8,
    border: "1px solid #334",
    fontSize: 13,
  },
};

/* ═══════ CHART OPTIONS ═══════ */

function makeChartOptions(titleText, onClick) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    onClick: onClick,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: titleText,
        color: "#ccc",
        font: { size: 14 },
      },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#aaa" },
        grid: { color: "#222" },
        title: { display: true, text: "Ilość", color: "#889" },
      },
      y: {
        ticks: {
          color: "#aaa",
          callback: v => v + "%",
        },
        grid: { color: "#222" },
        title: { display: true, text: "Prawdopodobieństwo %", color: "#889" },
      },
    },
  };
}

/* ═══════ GŁÓWNY KOMPONENT ═══════ */

export default function DrilldownCalc({ unit }) {
  // Wybrana broń
  const allWeapons = useMemo(() => {
    if (!unit) return [];
    return [
      ...(unit.weapons?.melee || []).map(w => ({ ...w, kind: "Melee" })),
      ...(unit.weapons?.ranged || []).map(w => ({ ...w, kind: "Ranged" })),
    ];
  }, [unit]);

  const [weaponIdx, setWeaponIdx] = useState(0);
  const [models, setModels] = useState(1);
  const [targetSave, setTargetSave] = useState(4);

  // Drilldown state
  const [selectedHits, setSelectedHits] = useState(null);
  const [selectedWounds, setSelectedWounds] = useState(null);

  const weapon = allWeapons[weaponIdx] || null;

  // Reset drilldown przy zmianie broni/modeli/save
  const resetDrill = () => {
    setSelectedHits(null);
    setSelectedWounds(null);
  };

  if (!unit || allWeapons.length === 0) {
    return (
      <div style={S.card}>
        <h3 style={S.title}>📊 Drilldown Calculator</h3>
        <p style={{ color: "#889" }}>Brak broni</p>
      </div>
    );
  }

  const totalAtk = parseAttacks(weapon.Atk) * models;
  const pHit = parseRollToProb(weapon.Hit);
  const pWound = parseRollToProb(weapon.Wound);
  const rend = parseRend(weapon.Rend);
  const effectiveSave = targetSave + rend;
  const pSave =
    effectiveSave >= 2 && effectiveSave <= 6
      ? parseRollToProb(`${effectiveSave}+`)
      : 0;
  const pFailSave = 1 - pSave;
  const dmgPerWound = parseDamage(weapon.Damage);

  // ── LEVEL 1: Rozkład hitów ──
  const hitDist = binomialDistribution(totalAtk, pHit);

  const hitChartData = {
    labels: hitDist.map(d => String(d.x)),
    datasets: [
      {
        data: hitDist.map(d => d.pPercent),
        backgroundColor: hitDist.map(d =>
          d.x === selectedHits ? COLORS.selected.bg : COLORS.hit.bg,
        ),
        borderColor: hitDist.map(d =>
          d.x === selectedHits ? COLORS.selected.border : COLORS.hit.border,
        ),
        borderWidth: 1,
      },
    ],
  };

  const hitOptions = makeChartOptions(
    `Rozkład hitów (${totalAtk} ataków, ${weapon.Hit} to hit)`,
    (event, elements) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        setSelectedHits(hitDist[idx].x);
        setSelectedWounds(null);
      }
    },
  );

  // ── LEVEL 2: Rozkład woundów (jeśli wybrano hity) ──
  const woundDist =
    selectedHits !== null ? binomialDistribution(selectedHits, pWound) : null;

  const woundChartData = woundDist
    ? {
        labels: woundDist.map(d => String(d.x)),
        datasets: [
          {
            data: woundDist.map(d => d.pPercent),
            backgroundColor: woundDist.map(d =>
              d.x === selectedWounds ? COLORS.selected.bg : COLORS.wound.bg,
            ),
            borderColor: woundDist.map(d =>
              d.x === selectedWounds
                ? COLORS.selected.border
                : COLORS.wound.border,
            ),
            borderWidth: 1,
          },
        ],
      }
    : null;

  const woundOptions = woundDist
    ? makeChartOptions(
        `Rozkład woundów (${selectedHits} hitów, ${weapon.Wound} to wound)`,
        (event, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            setSelectedWounds(woundDist[idx].x);
          }
        },
      )
    : null;

  // ── LEVEL 3: Rozkład unsaved (jeśli wybrano woundy) ──
  const saveDist =
    selectedWounds !== null
      ? binomialDistribution(selectedWounds, pFailSave)
      : null;

  const saveChartData = saveDist
    ? {
        labels: saveDist.map(d => String(d.x)),
        datasets: [
          {
            data: saveDist.map(d => d.pPercent),
            backgroundColor: saveDist.map(d => COLORS.save.bg),
            borderColor: saveDist.map(d => COLORS.save.border),
            borderWidth: 1,
          },
        ],
      }
    : null;

  const saveOptions = saveDist
    ? makeChartOptions(
        `Rozkład unsaved wounds (${selectedWounds} woundów vs ${
          effectiveSave <= 6 ? effectiveSave + "+" : "brak"
        } save)`,
        () => {},
      )
    : null;

  // ── Damage table z level 3 ──
  const damageTable = saveDist
    ? saveDist
        .filter(d => d.pPercent > 0.01)
        .map(d => ({
          unsaved: d.x,
          damage: Math.round(d.x * dmgPerWound * 100) / 100,
          probability: d.pPercent,
        }))
    : null;

  // Breadcrumb levels
  const level = selectedWounds !== null ? 3 : selectedHits !== null ? 2 : 1;

  return (
    <div style={S.card}>
      <h3 style={S.title}>📊 Drilldown Probability Calculator</h3>

      {/* Weapon picker */}
      <div style={{ ...S.controls, marginBottom: 12 }}>
        {allWeapons.map((w, i) => (
          <button
            key={i}
            style={S.weaponBtn(i === weaponIdx)}
            onClick={() => {
              setWeaponIdx(i);
              resetDrill();
            }}
          >
            {w.kind === "Melee" ? "⚔️" : "🏹"} {w.name}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={S.controls}>
        <div style={S.controlGroup}>
          <span style={S.label}>Modele</span>
          <input
            type="number"
            min="1"
            max="60"
            value={models}
            onChange={e => {
              setModels(Math.max(1, parseInt(e.target.value) || 1));
              resetDrill();
            }}
            style={S.input}
          />
        </div>
        <div style={S.controlGroup}>
          <span style={S.label}>Save celu</span>
          <select
            value={targetSave}
            onChange={e => {
              setTargetSave(parseInt(e.target.value));
              resetDrill();
            }}
            style={S.select}
          >
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={5}>5+</option>
            <option value={6}>6+</option>
            <option value={7}>Brak</option>
          </select>
        </div>
      </div>

      {/* Weapon info */}
      <div style={S.infoBox}>
        {[
          ["Attacks", `${totalAtk}`, "#4a9eff"],
          ["Hit", weapon.Hit || "-", "#4a9eff"],
          ["Wound", weapon.Wound || "-", "#ff8c4a"],
          ["Rend", weapon.Rend || "-", "#ff4a4a"],
          ["Dmg", weapon.Damage || "-", "#f5a623"],
          ["Save", effectiveSave <= 6 ? `${effectiveSave}+` : "—", "#4aff8b"],
        ].map(([label, val, color]) => (
          <div key={label} style={S.infoPill(color)}>
            <span style={S.infoPillVal}>{val}</span>
            <span style={S.infoPillLbl}>{label}</span>
          </div>
        ))}
      </div>

      {/* Breadcrumbs */}
      <div style={S.breadcrumb}>
        <button
          style={S.crumb(level >= 1)}
          onClick={() => {
            setSelectedHits(null);
            setSelectedWounds(null);
          }}
        >
          1. Hits ({totalAtk} atk)
        </button>

        {selectedHits !== null && (
          <button
            style={S.crumb(level >= 2)}
            onClick={() => {
              setSelectedWounds(null);
            }}
          >
            2. Wounds ({selectedHits} hits)
          </button>
        )}

        {selectedWounds !== null && (
          <button style={S.crumb(level >= 3)} onClick={() => {}}>
            3. Save ({selectedWounds} wnd)
          </button>
        )}
      </div>

      {/* ═══ LEVEL 1: HIT CHART ═══ */}
      <div style={S.chartWrap}>
        <div style={{ height: 280 }}>
          <Bar data={hitChartData} options={hitOptions} />
        </div>
        <p style={S.hint}>
          👆 Kliknij słupek aby zobaczyć rozkład woundów dla tej ilości hitów
        </p>
      </div>

      {/* ═══ LEVEL 2: WOUND CHART ═══ */}
      {selectedHits !== null && woundChartData && (
        <>
          <button
            style={S.backBtn}
            onClick={() => {
              setSelectedHits(null);
              setSelectedWounds(null);
            }}
          >
            ← Wróć do hitów
          </button>

          <div style={S.chartWrap}>
            <div style={{ height: 280 }}>
              <Bar data={woundChartData} options={woundOptions} />
            </div>
            <p style={S.hint}>
              👆 Kliknij słupek aby zobaczyć rozkład unsaved wounds (po save
              celu)
            </p>
          </div>
        </>
      )}

      {/* ═══ LEVEL 3: SAVE CHART + DAMAGE TABLE ═══ */}
      {selectedWounds !== null && saveChartData && (
        <>
          <button style={S.backBtn} onClick={() => setSelectedWounds(null)}>
            ← Wróć do woundów
          </button>

          <div style={S.chartWrap}>
            <div style={{ height: 280 }}>
              <Bar data={saveChartData} options={saveOptions} />
            </div>
          </div>

          {/* Damage table */}
          {damageTable && damageTable.length > 0 && (
            <>
              <h4 style={S.subtitle}>
                💀 Tabela obrażeń ({weapon.Damage} dmg per unsaved wound)
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table style={S.dmgTable}>
                  <thead>
                    <tr>
                      <th style={S.th}>Unsaved</th>
                      <th style={S.th}>Damage</th>
                      <th style={S.th}>Prawdop. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {damageTable.map(row => (
                      <tr key={row.unsaved}>
                        <td style={S.td}>{row.unsaved}</td>
                        <td
                          style={{
                            ...S.td,
                            color: "#f5a623",
                            fontWeight: "bold",
                          }}
                        >
                          {row.damage}
                        </td>
                        <td style={S.td}>{row.probability}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
