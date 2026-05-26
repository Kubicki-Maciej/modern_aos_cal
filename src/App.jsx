import { useEffect, useState, useMemo } from "react";
import DrilldownCalc from "./components/DrilldownCalc";

/* ---- math helpers ---- */

function rollProb(str) {
  if (!str) return 0;
  const m = String(str).match(/(\d+)/);
  if (!m) return 0;
  const t = parseInt(m[1], 10);
  if (t <= 1) return 1;
  if (t > 6) return 0;
  return (7 - t) / 6;
}

function avgDice(str) {
  if (!str) return 0;
  const s = String(str).trim().toUpperCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (m) {
    const n = m[1] ? parseInt(m[1], 10) : 1;
    const d = parseInt(m[2], 10);
    const mod = m[3] ? parseInt(m[3], 10) : 0;
    return Math.max(0, (n * (1 + d)) / 2 + mod);
  }
  return 0;
}

function rendVal(str) {
  if (!str || str === "-") return 0;
  const m = String(str).match(/-?(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function sim(w, save, models) {
  const a = avgDice(w.Atk) * models;
  const h = a * rollProb(w.Hit);
  const wo = h * rollProb(w.Wound);
  const es = save + rendVal(w.Rend);
  const sp = es >= 2 && es <= 6 ? rollProb(es + "+") : 0;
  const un = wo * (1 - sp);
  const dm = un * avgDice(w.Damage);
  const r = n => Math.round(n * 100) / 100;
  return {
    attacks: r(a),
    hits: r(h),
    wounds: r(wo),
    unsaved: r(un),
    damage: r(dm),
  };
}

/* ---- inline styles ---- */

const theme = {
  bg: "#0b0f17",
  panel: "#111927",
  card: "#182030",
  cardHover: "#1e2a3e",
  border: "#2a3548",
  borderLight: "#3a4d65",
  gold: "#f5a623",
  goldDark: "#b07a18",
  goldDim: "rgba(245,166,35,0.15)",
  text: "#e8eaf0",
  textDim: "#7a8ba0",
  textBright: "#fff",
  blue: "#4a9eff",
  red: "#ff5c5c",
  green: "#4aff8b",
  orange: "#ff8c4a",
  purple: "#b388ff",
  radius: 12,
  radiusSm: 8,
  font: "'Inter', 'Segoe UI', Arial, sans-serif",
};

/* ---- component ---- */

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [facName, setFacName] = useState(null);
  const [unit, setUnit] = useState(null);
  const [facQ, setFacQ] = useState("");
  const [unitQ, setUnitQ] = useState("");
  const [models, setModels] = useState(1);
  const [tSave, setTSave] = useState(4);

  // mobile dropdowns
  const [facOpen, setFacOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  useEffect(() => {
    fetch("/aos4_units.json")
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(d => setData(d))
      .catch(e => setErr(e.message));
  }, []);

  // detect mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const factions = useMemo(() => {
    if (!data) return [];
    return data.catalogues
      .filter(c => c.units && c.units.length > 0)
      .filter(c => c.catalogue.toLowerCase().includes(facQ.toLowerCase()))
      .sort((a, b) => a.catalogue.localeCompare(b.catalogue));
  }, [data, facQ]);

  const selFac = useMemo(() => {
    if (!facName || !data) return null;
    return data.catalogues.find(c => c.catalogue === facName) || null;
  }, [data, facName]);

  const units = useMemo(() => {
    if (!selFac) return [];
    return selFac.units
      .filter(u => u.name.toLowerCase().includes(unitQ.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selFac, unitQ]);

  const weapons = useMemo(() => {
    if (!unit) return [];
    return [
      ...(unit.weapons?.melee || []).map(w => ({ ...w, kind: "Melee" })),
      ...(unit.weapons?.ranged || []).map(w => ({ ...w, kind: "Ranged" })),
    ];
  }, [unit]);

  /* ---- loading / error ---- */

  if (err) {
    return (
      <div style={styles.screen}>
        <div style={styles.errorBox}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: theme.red, margin: "0 0 8px" }}>
            Błąd ładowania
          </h2>
          <p style={{ color: theme.textDim }}>{err}</p>
          <p style={{ color: theme.textDim, fontSize: 13 }}>
            Sprawdź czy <code style={styles.code}>public/aos4_units.json</code>{" "}
            istnieje
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.screen}>
        <div style={{ textAlign: "center" }}>
          <div style={styles.spinner} />
          <h2 style={{ color: theme.gold, marginTop: 20 }}>
            Ładowanie danych...
          </h2>
          <p style={{ color: theme.textDim }}>Age of Sigmar 4th Edition</p>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     MOBILE LAYOUT
     ════════════════════════════════════════ */

  if (isMobile) {
    return (
      <div style={{ ...styles.app, fontFamily: theme.font }}>
        {/* top bar */}
        <div style={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>⚔️</span>
            <h1 style={styles.topbarTitle}>AoS 4ed</h1>
          </div>
          <div style={{ color: theme.textDim, fontSize: 11 }}>
            {data.total_units} units
          </div>
        </div>

        {/* selectors */}
        <div style={styles.mobileSelectors}>
          {/* faction dropdown */}
          <div style={styles.mobileDropdownWrap}>
            <button
              style={styles.mobileDropdownBtn}
              onClick={() => {
                setFacOpen(!facOpen);
                setUnitOpen(false);
              }}
            >
              <span style={{ flex: 1, textAlign: "left" }}>
                {facName || "Wybierz frakcję..."}
              </span>
              <span>{facOpen ? "▲" : "▼"}</span>
            </button>

            {facOpen && (
              <div style={styles.mobileDropdownList}>
                <input
                  style={styles.mobileSearch}
                  placeholder="Szukaj frakcji..."
                  value={facQ}
                  onChange={e => setFacQ(e.target.value)}
                  autoFocus
                />
                <div style={styles.mobileListScroll}>
                  {factions.map(f => (
                    <button
                      key={f.catalogue}
                      style={styles.mobileListItem(facName === f.catalogue)}
                      onClick={() => {
                        setFacName(f.catalogue);
                        setUnit(null);
                        setUnitQ("");
                        setFacOpen(false);
                      }}
                    >
                      <span>{f.catalogue}</span>
                      <span style={styles.mobileBadge}>{f.units.length}</span>
                    </button>
                  ))}
                  {factions.length === 0 && (
                    <div
                      style={{
                        padding: 16,
                        color: theme.textDim,
                        textAlign: "center",
                      }}
                    >
                      Brak wyników
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* unit dropdown */}
          <div style={styles.mobileDropdownWrap}>
            <button
              style={{
                ...styles.mobileDropdownBtn,
                opacity: selFac ? 1 : 0.4,
                pointerEvents: selFac ? "auto" : "none",
              }}
              onClick={() => {
                setUnitOpen(!unitOpen);
                setFacOpen(false);
              }}
            >
              <span style={{ flex: 1, textAlign: "left" }}>
                {unit ? unit.name : "Wybierz jednostkę..."}
              </span>
              <span>{unitOpen ? "▲" : "▼"}</span>
            </button>

            {unitOpen && selFac && (
              <div style={styles.mobileDropdownList}>
                <input
                  style={styles.mobileSearch}
                  placeholder="Szukaj jednostki..."
                  value={unitQ}
                  onChange={e => setUnitQ(e.target.value)}
                  autoFocus
                />
                <div style={styles.mobileListScroll}>
                  {units.map((u, i) => (
                    <button
                      key={u.name + i}
                      style={styles.mobileListItem(unit?.name === u.name)}
                      onClick={() => {
                        setUnit(u);
                        setUnitOpen(false);
                      }}
                    >
                      <span>{u.name}</span>
                      <span style={styles.mobileBadge}>{u.points} pts</span>
                    </button>
                  ))}
                  {units.length === 0 && (
                    <div
                      style={{
                        padding: 16,
                        color: theme.textDim,
                        textAlign: "center",
                      }}
                    >
                      Brak jednostek
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* content */}
        <div style={{ padding: 12 }}>
          {!unit ? (
            <div style={styles.placeholder}>
              <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>
                🛡️
              </div>
              <h2
                style={{ color: theme.gold, fontSize: 18, margin: "0 0 8px" }}
              >
                {!facName ? "Wybierz frakcję" : "Wybierz jednostkę"}
              </h2>
              <p style={{ color: theme.textDim, fontSize: 14 }}>
                {!facName
                  ? "Użyj rozwijanej listy powyżej"
                  : `${units.length} jednostek w ${facName}`}
              </p>
            </div>
          ) : (
            <UnitContent
              unit={unit}
              weapons={weapons}
              models={models}
              setModels={setModels}
              tSave={tSave}
              setTSave={setTSave}
              compact={true}
            />
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     DESKTOP LAYOUT
     ════════════════════════════════════════ */

  return (
    <div style={{ ...styles.app, fontFamily: theme.font }}>
      {/* top bar */}
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>⚔️</span>
          <h1 style={styles.topbarTitle}>Age of Sigmar 4th Edition</h1>
          <span style={{ color: theme.textDim, fontSize: 13 }}>
            Unit Viewer & Calculator
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            color: theme.textDim,
            fontSize: 13,
          }}
        >
          <span>{data.total_catalogues} katalogów</span>
          <span style={{ color: theme.border }}>|</span>
          <span>{data.total_units} jednostek</span>
        </div>
      </div>

      <div style={styles.desktopLayout}>
        {/* left panel */}
        <div style={styles.desktopPanel}>
          <div style={styles.panelHeader}>
            <span>⚔️</span>
            <span>Frakcje</span>
          </div>
          <div style={{ padding: "0 10px" }}>
            <input
              style={styles.searchInput}
              placeholder="Szukaj frakcji..."
              value={facQ}
              onChange={e => setFacQ(e.target.value)}
            />
          </div>
          <div style={styles.panelList}>
            {factions.map(f => (
              <button
                key={f.catalogue}
                style={styles.listItem(facName === f.catalogue)}
                onClick={() => {
                  setFacName(f.catalogue);
                  setUnit(null);
                  setUnitQ("");
                }}
              >
                <span style={styles.listItemName}>{f.catalogue}</span>
                <span style={styles.listItemBadge(facName === f.catalogue)}>
                  {f.units.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* middle panel */}
        <div style={styles.desktopPanel}>
          <div style={styles.panelHeader}>
            <span>🪖</span>
            <span>Jednostki</span>
          </div>
          <div style={{ padding: "0 10px" }}>
            <input
              style={styles.searchInput}
              placeholder="Szukaj jednostki..."
              value={unitQ}
              onChange={e => setUnitQ(e.target.value)}
              disabled={!selFac}
            />
          </div>
          <div style={styles.panelList}>
            {!selFac && (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: theme.textDim,
                }}
              >
                ← Wybierz frakcję
              </div>
            )}
            {units.map((u, i) => (
              <button
                key={u.name + i}
                style={styles.listItem(unit?.name === u.name)}
                onClick={() => setUnit(u)}
              >
                <span style={styles.listItemName}>{u.name}</span>
                <span style={styles.listItemBadge(unit?.name === u.name)}>
                  {u.points} pts
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* main content */}
        <div style={styles.desktopContent}>
          {!unit ? (
            <div style={styles.placeholder}>
              <div style={{ fontSize: 72, marginBottom: 20, opacity: 0.3 }}>
                🛡️
              </div>
              <h2
                style={{ color: theme.gold, fontSize: 22, margin: "0 0 8px" }}
              >
                {!facName
                  ? "Wybierz frakcję aby rozpocząć"
                  : "Wybierz jednostkę"}
              </h2>
              <p style={{ color: theme.textDim }}>
                {!facName
                  ? "Kliknij na frakcję w panelu po lewej"
                  : `${units.length} jednostek dostępnych w ${facName}`}
              </p>
            </div>
          ) : (
            <UnitContent
              unit={unit}
              weapons={weapons}
              models={models}
              setModels={setModels}
              tSave={tSave}
              setTSave={setTSave}
              compact={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   UNIT CONTENT (shared between layouts)
   ════════════════════════════════════════ */

function UnitContent({
  unit,
  weapons,
  models,
  setModels,
  tSave,
  setTSave,
  compact,
}) {
  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      {/* header card */}
      <div style={styles.heroCard}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: compact ? "center" : "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: compact ? 20 : 26,
                color: theme.gold,
                letterSpacing: 0.5,
              }}
            >
              {unit.name}
            </h2>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {(unit.keywords || []).map((k, i) => (
                <span key={i} style={styles.keywordTag}>
                  {k}
                </span>
              ))}
            </div>
          </div>
          <div style={styles.pointsBadge}>{unit.points} pts</div>
        </div>

        {/* stats */}
        <div
          style={{
            display: "flex",
            gap: compact ? 8 : 12,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          {Object.entries(unit.stats || {}).map(([k, v]) => {
            if (!v || v === "-" || v === "") return null;
            const iconMap = {
              Move: "🏃",
              Health: "❤️",
              Save: "🛡️",
              Ward: "✨",
              Control: "🎯",
              Banishment: "⚡",
            };
            return (
              <div key={k} style={styles.statPill}>
                <span style={{ fontSize: 16 }}>{iconMap[k] || "📊"}</span>
                <span style={styles.statPillValue}>{v}</span>
                <span style={styles.statPillLabel}>{k}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* weapons table */}
      {weapons.length > 0 && (
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            <span>⚔️</span> Broń
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {(compact
                    ? ["", "Nazwa", "A", "H", "W", "R", "D"]
                    : [
                        "Typ",
                        "Nazwa",
                        "Rng",
                        "Atk",
                        "Hit",
                        "Wnd",
                        "Rend",
                        "Dmg",
                        "Crit",
                      ]
                  ).map(h => (
                    <th key={h} style={styles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weapons.map((w, i) => (
                  <tr key={i}>
                    <td style={styles.td}>
                      {w.kind === "Melee" ? "⚔️" : "🏹"}
                      {compact ? "" : ` ${w.kind}`}
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        fontWeight: 600,
                        color: theme.textBright,
                      }}
                    >
                      {w.name}
                    </td>
                    {!compact && <td style={styles.tdC}>{w.Range || "-"}</td>}
                    <td style={{ ...styles.tdC, color: theme.blue }}>
                      {w.Atk || "-"}
                    </td>
                    <td style={styles.tdC}>{w.Hit || "-"}</td>
                    <td style={styles.tdC}>{w.Wound || "-"}</td>
                    <td style={{ ...styles.tdC, color: theme.red }}>
                      {w.Rend || "-"}
                    </td>
                    <td
                      style={{
                        ...styles.tdC,
                        color: theme.orange,
                        fontWeight: 700,
                      }}
                    >
                      {w.Damage || "-"}
                    </td>
                    {!compact && (
                      <td
                        style={{
                          ...styles.tdC,
                          color: theme.purple,
                          fontSize: 12,
                        }}
                      >
                        {w.Crit || "-"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* avg damage */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>
          <span>📈</span> Średni damage
        </h3>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={styles.controlBox}>
            <span style={styles.controlLabel}>Modele</span>
            <input
              type="number"
              min="1"
              max="60"
              value={models}
              onChange={e =>
                setModels(Math.max(1, parseInt(e.target.value) || 1))
              }
              style={styles.controlInput}
            />
          </div>
          <div style={styles.controlBox}>
            <span style={styles.controlLabel}>Save celu</span>
            <select
              value={tSave}
              onChange={e => setTSave(parseInt(e.target.value))}
              style={styles.controlInput}
            >
              {[2, 3, 4, 5, 6, 7].map(v => (
                <option key={v} value={v}>
                  {v <= 6 ? v + "+" : "Brak"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {weapons.map((w, wi) => {
          const cur = sim(w, tSave, models);
          return (
            <div
              key={wi}
              style={{
                marginBottom: 20,
                paddingTop: wi ? 16 : 0,
                borderTop: wi ? `1px solid ${theme.border}` : "none",
              }}
            >
              <h4
                style={{
                  color: theme.textBright,
                  margin: "0 0 10px",
                  fontSize: 15,
                }}
              >
                {w.kind === "Melee" ? "⚔️" : "🏹"} {w.name}
              </h4>

              {/* pipeline */}
              <div style={styles.pipeline}>
                {[
                  ["Ataki", cur.attacks, theme.blue],
                  ["Hity", cur.hits, theme.blue],
                  ["Woundy", cur.wounds, theme.orange],
                  ["Po save", cur.unsaved, theme.green],
                  ["DMG", cur.damage, theme.gold],
                ].map(([label, val, color], idx) => (
                  <div
                    key={label}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {idx > 0 && (
                      <span style={{ color: theme.textDim, fontSize: 16 }}>
                        →
                      </span>
                    )}
                    <div style={styles.pipeBox(label === "DMG")}>
                      <span
                        style={{
                          ...styles.pipeVal,
                          color:
                            label === "DMG" ? theme.gold : theme.textBright,
                        }}
                      >
                        {val}
                      </span>
                      <span style={styles.pipeLbl}>{label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* table vs saves */}
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Save", "Atk", "Hits", "Wnd", "Unsaved", "DMG"].map(
                        h => (
                          <th key={h} style={styles.th}>
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[2, 3, 4, 5, 6, 7].map(sv => {
                      const r = sim(w, sv, models);
                      const active = sv === tSave;
                      return (
                        <tr
                          key={sv}
                          style={
                            active ? { background: theme.goldDim } : undefined
                          }
                        >
                          <td style={styles.tdC}>{sv <= 6 ? sv + "+" : "—"}</td>
                          <td style={styles.tdC}>{r.attacks}</td>
                          <td style={styles.tdC}>{r.hits}</td>
                          <td style={styles.tdC}>{r.wounds}</td>
                          <td style={styles.tdC}>{r.unsaved}</td>
                          <td
                            style={{
                              ...styles.tdC,
                              fontWeight: 700,
                              color: active ? theme.gold : theme.text,
                            }}
                          >
                            {r.damage}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* drilldown */}
      <DrilldownCalc unit={unit} />

      {/* abilities */}
      {unit.abilities && unit.abilities.length > 0 && (
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            <span>📜</span> Abilities
          </h3>
          {unit.abilities.map((a, i) => (
            <AbilityCard key={i} ability={a} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   ABILITY CARD (collapsible)
   ════════════════════════════════════════ */

function AbilityCard({ ability }) {
  const [open, setOpen] = useState(false);

  const typeIcon = {
    "Ability (Passive)": "🔵",
    "Ability (Activated)": "🟠",
    Spell: "🔮",
    "Spell (Activated)": "🔮",
    Prayer: "🙏",
    "Prayer (Activated)": "🙏",
  };

  return (
    <div style={styles.abilityCard(open)}>
      <button style={styles.abilityHeader} onClick={() => setOpen(!open)}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>
          {typeIcon[ability.type] || "🟢"}
        </span>
        <span style={{ flex: 1, fontWeight: 600, color: theme.textBright }}>
          {ability.name}
        </span>
        <span style={styles.abilityType}>{ability.type}</span>
        <span style={{ color: theme.textDim, fontSize: 12 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={styles.abilityBody}>
          {ability.keywords && (
            <div style={styles.abilityField}>
              <strong style={styles.abilityLabel}>Keywords</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {ability.keywords.split(",").map((kw, i) => (
                  <span key={i} style={styles.keywordTag}>
                    {kw.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {ability.casting_value && (
            <div style={styles.abilityField}>
              <strong style={styles.abilityLabel}>Casting Value</strong>
              <span>{ability.casting_value}</span>
            </div>
          )}
          {ability.chanting_value && (
            <div style={styles.abilityField}>
              <strong style={styles.abilityLabel}>Chanting Value</strong>
              <span>{ability.chanting_value}</span>
            </div>
          )}
          {ability.declare && (
            <div style={styles.abilityField}>
              <strong style={styles.abilityLabel}>Declare</strong>
              <span>{ability.declare}</span>
            </div>
          )}
          {ability.effect && (
            <div style={styles.abilityField}>
              <strong style={styles.abilityLabel}>Effect</strong>
              <span>{ability.effect}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   ALL STYLES
   ════════════════════════════════════════ */

const styles = {
  app: {
    background: theme.bg,
    color: theme.text,
    minHeight: "100vh",
  },

  screen: {
    background: theme.bg,
    color: theme.text,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: theme.font,
  },

  errorBox: {
    background: theme.card,
    border: `2px solid ${theme.red}`,
    borderRadius: theme.radius,
    padding: 40,
    textAlign: "center",
    maxWidth: 400,
  },

  code: {
    background: theme.bg,
    padding: "2px 6px",
    borderRadius: 4,
    color: theme.gold,
    fontSize: 12,
  },

  spinner: {
    width: 44,
    height: 44,
    border: `4px solid ${theme.border}`,
    borderTopColor: theme.gold,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },

  /* ── Top Bar ── */
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    background: `linear-gradient(135deg, ${theme.panel} 0%, #0f1923 100%)`,
    borderBottom: `2px solid ${theme.goldDark}`,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  topbarTitle: {
    margin: 0,
    fontSize: 18,
    color: theme.gold,
    fontWeight: 700,
  },

  /* ── Desktop Layout ── */
  desktopLayout: {
    display: "flex",
    height: "calc(100vh - 52px)",
  },

  desktopPanel: {
    width: 270,
    flexShrink: 0,
    borderRight: `1px solid ${theme.border}`,
    background: theme.panel,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  desktopContent: {
    flex: 1,
    overflowY: "auto",
    padding: 24,
  },

  panelHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 16px 10px",
    color: theme.gold,
    fontWeight: 700,
    fontSize: 15,
    borderBottom: `1px solid ${theme.border}`,
  },

  searchInput: {
    width: "100%",
    padding: "9px 12px",
    margin: "10px 0 6px",
    borderRadius: theme.radiusSm,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontSize: 13,
    outline: "none",
    fontFamily: theme.font,
  },

  panelList: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 8px",
  },

  listItem: active => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "9px 12px",
    marginBottom: 2,
    borderRadius: theme.radiusSm,
    border: active ? `1px solid ${theme.goldDark}` : "1px solid transparent",
    background: active ? theme.goldDim : "transparent",
    color: active ? theme.gold : theme.text,
    cursor: "pointer",
    fontSize: 13,
    textAlign: "left",
    fontFamily: theme.font,
    transition: "all 0.12s",
  }),

  listItemName: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  listItemBadge: active => ({
    background: active ? theme.goldDark : theme.bg,
    color: active ? theme.bg : theme.textDim,
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    marginLeft: 8,
    flexShrink: 0,
  }),

  /* ── Mobile ── */
  mobileSelectors: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: theme.panel,
    borderBottom: `1px solid ${theme.border}`,
    position: "sticky",
    top: 48,
    zIndex: 90,
  },

  mobileDropdownWrap: {
    position: "relative",
  },

  mobileDropdownBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: theme.radiusSm,
    border: `1px solid ${theme.border}`,
    background: theme.card,
    color: theme.text,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: theme.font,
  },

  mobileDropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: theme.card,
    border: `1px solid ${theme.borderLight}`,
    borderRadius: theme.radiusSm,
    marginTop: 4,
    zIndex: 200,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    overflow: "hidden",
  },

  mobileSearch: {
    width: "100%",
    padding: "10px 14px",
    border: "none",
    borderBottom: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontSize: 14,
    outline: "none",
    fontFamily: theme.font,
  },

  mobileListScroll: {
    maxHeight: 260,
    overflowY: "auto",
  },

  mobileListItem: active => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "11px 14px",
    border: "none",
    borderBottom: `1px solid ${theme.border}`,
    background: active ? theme.goldDim : "transparent",
    color: active ? theme.gold : theme.text,
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
    fontFamily: theme.font,
  }),

  mobileBadge: {
    background: theme.bg,
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 11,
    color: theme.textDim,
    flexShrink: 0,
  },

  /* ── Placeholder ── */
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 400,
    textAlign: "center",
  },

  /* ── Cards ── */
  heroCard: {
    background: `linear-gradient(135deg, ${theme.card} 0%, #1a2840 100%)`,
    border: `1px solid ${theme.goldDark}`,
    borderRadius: theme.radius,
    padding: 20,
    marginBottom: 16,
  },

  sectionCard: {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    margin: "0 0 14px",
    color: theme.gold,
    fontSize: 16,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  keywordTag: {
    display: "inline-block",
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    padding: "3px 10px",
    borderRadius: 16,
    fontSize: 11,
    color: theme.textDim,
  },

  pointsBadge: {
    background: theme.gold,
    color: theme.bg,
    padding: "8px 18px",
    borderRadius: 24,
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },

  /* stat pills */
  statPill: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    padding: "8px 14px",
    minWidth: 70,
    gap: 2,
  },

  statPillValue: {
    fontSize: 22,
    fontWeight: 700,
    color: theme.textBright,
  },

  statPillLabel: {
    fontSize: 10,
    color: theme.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* controls */
  controlBox: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  controlLabel: {
    fontSize: 11,
    color: theme.textDim,
    textTransform: "uppercase",
  },

  controlInput: {
    padding: "8px 10px",
    borderRadius: theme.radiusSm,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontSize: 14,
    width: 100,
    outline: "none",
    fontFamily: theme.font,
  },

  /* pipeline */
  pipeline: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  pipeBox: highlight => ({
    background: theme.bg,
    border: `1px solid ${highlight ? theme.gold : theme.border}`,
    borderRadius: theme.radiusSm,
    padding: "8px 12px",
    textAlign: "center",
    minWidth: 64,
  }),

  pipeVal: {
    fontSize: 18,
    fontWeight: 700,
    display: "block",
  },

  pipeLbl: {
    fontSize: 10,
    color: theme.textDim,
    textTransform: "uppercase",
  },

  /* table */
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },

  th: {
    background: theme.bg,
    color: theme.gold,
    fontWeight: 700,
    fontSize: 12,
    padding: "8px 10px",
    textAlign: "center",
    borderBottom: `2px solid ${theme.goldDark}`,
  },

  td: {
    padding: "8px 10px",
    borderBottom: `1px solid ${theme.border}`,
  },

  tdC: {
    padding: "8px 10px",
    borderBottom: `1px solid ${theme.border}`,
    textAlign: "center",
  },

  /* ability */
  abilityCard: open => ({
    background: theme.bg,
    border: `1px solid ${open ? theme.goldDark : theme.border}`,
    borderRadius: theme.radiusSm,
    marginBottom: 6,
    overflow: "hidden",
  }),

  abilityHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "11px 14px",
    background: "transparent",
    border: "none",
    color: theme.text,
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
    fontFamily: theme.font,
  },

  abilityType: {
    fontSize: 11,
    color: theme.textDim,
    background: theme.card,
    padding: "2px 8px",
    borderRadius: 10,
    flexShrink: 0,
  },

  abilityBody: {
    padding: "0 14px 14px",
    borderTop: `1px solid ${theme.border}`,
  },

  abilityField: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.6,
  },

  abilityLabel: {
    display: "block",
    color: theme.gold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
};

/* spinner animation - inject */
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(styleEl);
}
