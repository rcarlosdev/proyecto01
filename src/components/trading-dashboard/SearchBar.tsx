// src/components/trading-dashboard/SearchBar.tsx
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/useDebounce";
import { useMarketStore } from "@/stores/useMarketStore";

type SearchBarProps = { onSearchChange?: (value: string) => void };

const SearchBar = ({ onSearchChange }: SearchBarProps) => {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 500);
  const { setSearchTerm } = useMarketStore();

  // Solo sincroniza el store (NO llama al padre aquí para evitar bucles)
  useEffect(() => {
    setSearchTerm(debouncedInput);
  }, [debouncedInput, setSearchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setInput(term);
    // Solo aquí notificamos al padre (para abrir el acordeón al tipear)
    onSearchChange?.(term);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <svg
          width="30" height="30" viewBox="0 0 19 22" fill="none" aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        >
          <path
            d="M18 17.5L13.0001 12.5M14.6667 8.33333C14.6667 11.555 12.055 14.1667 8.83333 14.1667C5.61167 14.1667 3 11.555 3 8.33333C3 5.11167 5.61167 2.5 8.83333 2.5C12.055 2.5 14.6667 5.11167 14.6667 8.33333Z"
            stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        <Input
          type="search"
          placeholder="Buscar símbolos…"
          aria-label="Buscar símbolos"
          value={input}
          onChange={handleChange}
          className="w-full pl-12 pr-4 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
        />
      </div>
    </div>
  );
};

export default SearchBar;
