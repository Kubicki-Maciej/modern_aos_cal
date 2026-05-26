// Silnia z cache
const factCache = [1, 1];
function factorial(n) {
  if (n < 0) return 1;
  if (factCache[n] !== undefined) return factCache[n];
  let result = factCache[factCache.length - 1];
  for (let i = factCache.length; i <= n; i++) {
    result *= i;
    factCache[i] = result;
  }
  return result;
}

// Współczynnik dwumianowy C(n, k)
export function binomial(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  // Używamy mniejszego k dla wydajności
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

// Rozkład dwumianowy: P(dokładnie k sukcesów z n prób, p = szansa)
export function binomialPMF(n, k, p) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return binomial(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// Cały rozkład: tablica [{x: 0, p: ...}, {x: 1, p: ...}, ...]
export function binomialDistribution(n, p) {
  const dist = [];
  for (let k = 0; k <= n; k++) {
    dist.push({
      x: k,
      p: binomialPMF(n, k, p),
      pPercent: Math.round(binomialPMF(n, k, p) * 10000) / 100,
    });
  }
  return dist;
}

// P(X >= k)
export function binomialCDF_gte(n, k, p) {
  let sum = 0;
  for (let i = k; i <= n; i++) {
    sum += binomialPMF(n, i, p);
  }
  return sum;
}

// Parsuje "3+" na szansę
export function parseRollToProb(value) {
  if (!value) return 0;
  const match = String(value).match(/(\d+)/);
  if (!match) return 0;
  const target = parseInt(match[1], 10);
  if (target <= 1) return 1;
  if (target > 6) return 0;
  return (7 - target) / 6;
}

// Parsuje rend
export function parseRend(value) {
  if (!value || value === "-") return 0;
  const match = String(value).match(/-?(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Parsuje ataki "3", "D6", "2D6+1" -> średnia (dla uproszczenia bierzemy stałą)
export function parseAttacks(value) {
  if (!value) return 0;
  const s = String(value).trim().toUpperCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  // Dla kości bierzemy średnią i zaokrąglamy (bo binomial wymaga int)
  const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (m) {
    const n = m[1] ? parseInt(m[1], 10) : 1;
    const d = parseInt(m[2], 10);
    const mod = m[3] ? parseInt(m[3], 10) : 0;
    return Math.max(1, Math.round((n * (1 + d)) / 2 + mod));
  }
  return parseInt(s, 10) || 0;
}

export function parseDamage(value) {
  if (!value) return 1;
  const s = String(value).trim().toUpperCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (m) {
    const n = m[1] ? parseInt(m[1], 10) : 1;
    const d = parseInt(m[2], 10);
    const mod = m[3] ? parseInt(m[3], 10) : 0;
    return Math.max(1, (n * (1 + d)) / 2 + mod);
  }
  return 1;
}
