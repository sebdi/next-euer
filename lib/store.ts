"use client";

import { useCallback, useEffect, useState } from "react";
import { BEISPIEL_BUCHUNGEN } from "./sample-data";
import type { Buchung, BuchungInput } from "./types";

const STORAGE_KEY = "nexteuer.buchungen.v1";

function load(): Buchung[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Buchung[];
    }
  } catch {
    // Speicher nicht verfügbar — mit Beispieldaten weiterarbeiten
  }
  return BEISPIEL_BUCHUNGEN;
}

function save(buchungen: Buchung[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buchungen));
  } catch {
    // ignorieren
  }
}

/**
 * Demo-Datenhaltung im Browser. Die Oberfläche spricht nur mit diesem Hook —
 * für ein echtes Backend genügt es, ihn gegen API-Aufrufe auszutauschen.
 */
export function useBuchungen() {
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBuchungen(load());
    setLoading(false);
  }, []);

  const update = useCallback((fn: (prev: Buchung[]) => Buchung[]) => {
    setBuchungen((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (input: BuchungInput) => {
      const buchung: Buchung = { ...input, id: crypto.randomUUID() };
      update((prev) => [...prev, buchung]);
      return buchung;
    },
    [update],
  );

  const edit = useCallback(
    (id: string, input: BuchungInput) => {
      update((prev) => prev.map((b) => (b.id === id ? { ...input, id } : b)));
    },
    [update],
  );

  const remove = useCallback(
    (id: string) => {
      update((prev) => prev.filter((b) => b.id !== id));
    },
    [update],
  );

  const restore = useCallback(
    (buchung: Buchung) => {
      update((prev) =>
        prev.some((b) => b.id === buchung.id) ? prev : [...prev, buchung],
      );
    },
    [update],
  );

  return { buchungen, loading, add, edit, remove, restore };
}
