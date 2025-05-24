
import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  query: string;
  setQuery: (q: string) => void;
  placeholder: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onFocus: () => void;
  onClick: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  query,
  setQuery,
  placeholder,
  inputRef,
  onFocus,
  onClick,
}) => {
  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-2"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={onFocus}
      onClick={onClick}
      autoComplete="off"
    />
  );
};

export default SearchInput;
