
import React from "react";
import { X, Mic, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchActionsProps {
  query: string;
  enhancing: boolean;
  isListening: boolean;
  clearSearch: () => void;
  handleVoiceSearch: () => void;
  handleSearchButtonClick: (e?: React.MouseEvent) => void;
}

const SearchActions: React.FC<SearchActionsProps> = ({
  query,
  enhancing,
  isListening,
  clearSearch,
  handleVoiceSearch,
  handleSearchButtonClick,
}) => {
  return (
    <>
      {query && (
        <button
          type="button"
          onClick={clearSearch}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <button
        type="button"
        onClick={handleVoiceSearch}
        className={cn(
          "p-2 transition-colors rounded-full",
          isListening ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Voice search"
      >
        <Mic className="h-5 w-5" />
      </button>
      <button
        type="submit"
        className={cn(
          "p-2 text-primary hover:text-primary-foreground hover:bg-primary rounded-full transition-colors flex items-center",
          enhancing && "opacity-70"
        )}
        aria-label="Search"
        onClick={handleSearchButtonClick}
        disabled={enhancing}
      >
        {enhancing ? <Sparkles className="h-5 w-5 animate-pulse" /> : <Search className="h-5 w-5" />}
      </button>
    </>
  );
};

export default SearchActions;
