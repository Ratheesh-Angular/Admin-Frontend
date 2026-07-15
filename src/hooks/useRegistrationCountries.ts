"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchRegistrationCountries,
  type CountryRow,
} from "@/lib/registration-countries";

export function useRegistrationCountries(enabled = true) {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCountries(await fetchRegistrationCountries());
    } catch {
      setCountries([]);
      setError("Could not load registration countries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void reload();
  }, [enabled, reload]);

  return { countries, loading, error, reload };
}
