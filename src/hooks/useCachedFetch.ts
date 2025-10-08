// src/hooks/useCachedFetch.ts
"use client";

import { useEffect, useRef, useState } from "react";

type FetchResult = {
  data: any | null;
  loading: boolean;
  error: any | null;
};

const CACHE = new Map<string, any>();
const IN_FLIGHT = new Map<string, Promise<any>>();

/**
 * useCachedFetch(url, options)
 * - cachea responses por URL en memoria (Map)
 * - evita requests duplicados usando IN_FLIGHT
 * - soporta revalidateOnFocus (por ahora en options, no implementado focus)
 */
export default function useCachedFetch(url?: string | null, options?: { revalidateOnFocus?: boolean }) {
  const [state, setState] = useState<FetchResult>({ data: null, loading: !!url, error: null });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    const cached = CACHE.get(url);
    if (cached) {
      setState({ data: cached, loading: false, error: null });
      return;
    }

    // si ya hay una petición en vuelo para la misma URL, usala
    const inFlight = IN_FLIGHT.get(url);
    if (inFlight) {
      setState((s) => ({ ...s, loading: true }));
      inFlight
        .then((res) => {
          if (cancelled) return;
          setState({ data: res, loading: false, error: null });
        })
        .catch((err) => {
          if (cancelled) return;
          setState({ data: null, loading: false, error: err });
        });
      return;
    }

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const p = fetch(url, { signal }).then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

    IN_FLIGHT.set(url, p);
    setState({ data: null, loading: true, error: null });

    p.then((json) => {
      CACHE.set(url, json);
      IN_FLIGHT.delete(url);
      if (!cancelled) setState({ data: json, loading: false, error: null });
    }).catch((err) => {
      IN_FLIGHT.delete(url);
      if (!cancelled) setState({ data: null, loading: false, error: err });
    });

    return () => {
      cancelled = true;
      if (abortRef.current) abortRef.current.abort();
    };
  }, [url]);

  return state;
}
