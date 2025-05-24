import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { useSearchEnhancement } from "@/hooks/useSearchEnhancement";
import SearchAuthDialog from "./search/SearchAuthDialog";
import SearchInput from "./search/SearchInput";
import SearchActions from "./search/SearchActions";
interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
  placeholder?: string;
  initialValue?: string;
  currentRoute?: string;
}
const suggestionExamples = ["hidden gem restaurants in Indiranagar", "good flute teacher in Malleshwaram", "places to visit in Nagarbhavi", "best unisex salon near me", "plumbers available right now", "Honda WRV 2018",
// added marketplace examples
"used iPhone 13 Pro Max", "second hand furniture in HSR Layout"];
const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  className,
  placeholder,
  initialValue = "",
  currentRoute
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const currentPath = location.pathname;
  const [query, setQuery] = useState(initialValue);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Get correct variables and methods from the hook
  const {
    enhancing,
    enhanceQuery
  } = useSearchEnhancement();
  const {
    isListening,
    startSpeechRecognition
  } = useVoiceSearch({
    onTranscript: transcript => {
      setQuery(transcript);
      setTimeout(() => {
        if (shouldNavigateOnSearch()) {
          navigateToSearch(transcript);
        } else {
          onSearch(transcript);
        }
      }, 500);
    }
  });

  // Helper function to determine if we should navigate on search
  const shouldNavigateOnSearch = () => {
    // Always stay on search page
    if (currentPath === "/search") {
      return false;
    }

    // Stay on marketplace pages
    if (currentPath === "/marketplace" || currentPath.startsWith("/marketplace/")) {
      return false;
    }

    // For home page, always navigate to search
    if (currentPath === "/") {
      return true;
    }

    // For location details pages, always navigate to search
    if (currentPath.startsWith("/location/")) {
      return true;
    }
    return true;
  };

  // Helper function to navigate to search page
  const navigateToSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const searchParams = new URLSearchParams();
    searchParams.set('q', searchQuery);

    // If we're on a category page, include the category
    if (currentPath.includes('/category/')) {
      const category = currentPath.split('/category/')[1];
      if (category) {
        searchParams.set('category', category);
      }
    }
    console.log(`Navigating to search page with query: ${searchQuery}`);
    navigate(`/search?${searchParams.toString()}`);
  };
  const getPlaceholder = () => {
    if (currentPath === "/events" || currentPath.startsWith("/events")) {
      return "Search for events...";
    }
    if (currentPath === "/marketplace" || currentPath.startsWith("/marketplace")) {
      return "Search for cars, bikes, mobiles...";
    }
    if (currentRoute === "/my-list" || currentPath === "/my-list") {
      return "Search from your list...";
    }
    return placeholder || "What are you looking for today?";
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    if (query.trim()) {
      console.log("Original search query:", query);
      let enhancedQuery = query;

      // On marketplace, we'll use our improved natural language processing
      if (currentPath === "/marketplace" || currentPath.startsWith("/marketplace")) {
        console.log("Marketplace search: Normalizing query without enhancement");
        // Just normalize the query to handle multi-line input
        enhancedQuery = query.replace(/\s+/g, ' ').trim();
      }
      // For regular searches, use the enhancement service
      else if (currentPath !== "/events") {
        console.log("Not a marketplace or events page, enhancing query");
        enhancedQuery = await enhanceQuery(query, currentPath !== "/");
      }
      console.log("Final search query to use:", enhancedQuery);
      if (enhancedQuery !== query) {
        setQuery(enhancedQuery);
      }

      // Always navigate to search page for business/service searches based on current path
      if (shouldNavigateOnSearch()) {
        console.log("Navigating to search page with query from handleSubmit");
        navigateToSearch(enhancedQuery);
      } else {
        console.log("Using onSearch callback for query:", enhancedQuery);
        onSearch(enhancedQuery);
      }
      if (query.trim().length < 8 && currentPath !== "/events" && currentPath !== "/marketplace" && !currentPath.startsWith("/marketplace")) {
        const randomSuggestion = suggestionExamples[Math.floor(Math.random() * suggestionExamples.length)];
        toast({
          title: "Try natural language",
          description: `Try being more specific like "${randomSuggestion}"`,
          duration: 5000
        });
      }
    }
  };
  const clearSearch = () => {
    setQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  const handleSearchButtonClick = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    if (query.trim()) {
      let enhancedQuery = query;

      // On marketplace, we'll use our improved natural language processing
      if (currentPath === "/marketplace" || currentPath.startsWith("/marketplace")) {
        console.log("Marketplace search: Normalizing query without enhancement");
        // Just normalize the query to handle multi-line input
        enhancedQuery = query.replace(/\s+/g, ' ').trim();
      }
      // For regular searches, use the enhancement service
      else if (currentPath !== "/events") {
        enhancedQuery = await enhanceQuery(query, currentPath !== "/");
      }
      if (enhancedQuery !== query) {
        setQuery(enhancedQuery);
      }

      // Check if we should navigate or use the onSearch callback
      if (shouldNavigateOnSearch()) {
        console.log("Navigating to search page with query from button click");
        navigateToSearch(enhancedQuery);
      } else {
        console.log("Using onSearch callback for query from button click:", enhancedQuery);
        onSearch(enhancedQuery);
      }
    }
  };
  const handleVoiceSearch = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    startSpeechRecognition();
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node) && isExpanded) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);
  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);
  return <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <form ref={formRef} onSubmit={handleSubmit} className="w-full bg-white rounded-xl shadow-md border border-border/50">
        
      </form>

      <SearchAuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>;
};
export default SearchBar;