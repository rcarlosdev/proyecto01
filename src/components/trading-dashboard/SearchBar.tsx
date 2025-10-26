import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import { useMarketStore } from "@/stores/useMarketStore";

// Componente de búsqueda
const SearchBar = () => {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 500);

  const { setSearchTerm } = useMarketStore();

  // usar hook de debounce si es necesario
  useEffect(() => {
    setSearchTerm(debouncedInput);
  }, [debouncedInput, setSearchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setInput(term);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <svg
          width="30"
          height="30"
          viewBox="0 0 19 22"
          fill="none"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        >
          <path
            d="M18 17.5L13.0001 12.5M14.6667 8.33333C14.6667 11.555 12.055 14.1667 8.83333 14.1667C5.61167 14.1667 3 11.555 3 8.33333C3 5.11167 5.61167 2.5 8.83333 2.5C12.055 2.5 14.6667 5.11167 14.6667 8.33333Z"
            stroke="currentColor"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <Input
          type="text"
          placeholder="Búsqueda"
          className="w-full pl-12 pr-4 py-2"
          onChange={(e) => handleSearch(e)}
        />
      </div>
    </div>
  );
};

export default SearchBar;
