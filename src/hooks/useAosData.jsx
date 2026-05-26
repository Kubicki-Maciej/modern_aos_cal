import { useState, useEffect, useMemo } from "react";

export function useAosData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/aos4_units.json")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Wyciągnij listę frakcji (katalogów z jednostkami)
  const factions = useMemo(() => {
    if (!data) return [];
    return data.catalogues
      .filter(c => c.unit_count > 0)
      .map(c => ({
        name: c.catalogue,
        file: c.file,
        unitCount: c.unit_count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Pobierz jednostki danej frakcji
  const getUnits = factionName => {
    if (!data) return [];
    const catalogue = data.catalogues.find(c => c.catalogue === factionName);
    return catalogue ? catalogue.units : [];
  };

  return { data, loading, error, factions, getUnits };
}
