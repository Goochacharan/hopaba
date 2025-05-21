import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { ChevronDown } from "lucide-react";
import SubcategorySelector from "./SubcategorySelector";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

// Array of bold, vibrant Tailwind background color classes
const categoryButtonColors = [
  "bg-[#ea384c]",  // Red
  "bg-[#9b87f5]",  // Primary Purple
  "bg-[#7E69AB]",  // Secondary Purple
  "bg-[#12b981]",  // Emerald Green
  "bg-[#F97316]",  // Bright Orange
  "bg-[#0EA5E9]",  // Ocean Blue
  "bg-[#8B5CF6]",  // Vivid Purple
  "bg-[#D946EF]",  // Magenta Pink
  "bg-[#22d3ee]",  // Cyan
  "bg-[#34d399]",  // Soft Green
  "bg-[#FBBF24]",  // Yellow
  "bg-[#ec4899]",  // Fuchsia
  "bg-[#6366f1]",  // Indigo
  "bg-[#ef4444]",  // Soft Red
  "bg-[#FDBA74]",  // Soft Orange
  "bg-[#38bdf8]",  // Light Blue
  "bg-[#a3e635]",  // Lime Green
  "bg-[#f43f5e]",  // Rose
  "bg-[#c084fc]",  // Light Purple
  "bg-[#14b8a6]",  // Teal
  "bg-[#bbf7d0]",  // Mint
  "bg-[#facc15]",  // Gold
  "bg-[#eab308]",  // Mustard
  "bg-[#fde68a]",  // Pale Yellow
  "bg-[#60a5fa]",  // Blue
  "bg-[#d1fae5]",  // Pale Green
  "bg-[#fef08a]",  // Light Yellow
  "bg-[#fda4af]",  // Pink
  "bg-[#f59e42]",  // Orange
  "bg-[#7dd3fc]",  // Sky Blue
  "bg-[#b91c1c]",  // Deep Red
  "bg-[#7c3aed]",  // Deep Indigo
  "bg-[#e879f9]",  // Light Magenta
  "bg-[#86efac]",  // Pale Mint
  "bg-[#6366f1]",  // Dark Indigo
  "bg-[#065f46]",  // Forest Green
  "bg-[#f472b6]",  // Bubblegum Pink
  "bg-[#c7d2fe]",  // Periwinkle
  "bg-[#3b82f6]",  // Medium Blue
  "bg-[#0d9488]",  // Dark Teal
  "bg-[#1e40af]",  // Navy Blue
  "bg-[#f3e8ff]",  // Lavender
  "bg-[#f1f5f9]"   // Off White (for "Other")
];

// "All" button background: white, gray bold font for contrast
const allButtonBg = "bg-white";
const allButtonText = "text-[#555] font-bold";
const categoryButtonText = "text-white font-bold";

// Unified subtle border
const borderStyle = "border border-[#eaeaea]";
// Shadow for depth
const depthShadow = "shadow-[0_2px_14px_0_rgba(22,25,34,0.13)]";

// Rectangular shape & spacing
const buttonShapeStyles =
  "flex-shrink-0 px-5 py-2.5 rounded-[11px] text-base select-none cursor-pointer min-w-[156px] h-12 transition-all duration-150 flex items-center justify-center";

// Selected and idle states
const selectedStyles = "ring-2 ring-[#ea384c] border-[#ea384c] scale-105";
const idleStyles = "opacity-95 hover:opacity-100 hover:scale-105";

// Main component
interface CategoryScrollBarProps {
  selected: string;
  onSelect: (category: string) => void;
  className?: string;
  selectedSubcategory?: string[];  // Changed from string to string[]
  onSubcategorySelect?: (subcategories: string[]) => void;  // Changed from string to string[]
}

const CategoryScrollBar: React.FC<CategoryScrollBarProps> = ({
  selected,
  onSelect,
  className,
  selectedSubcategory = [],  // Default to empty array
  onSubcategorySelect
}) => {
  const { data: categoriesData, isLoading } = useCategories();
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | undefined>();
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);
  
  // Normalize category name for consistent comparison
  const normalizeCategory = (category: string): string => {
    return category ? category.toLowerCase().trim() : '';
  };
  
  useEffect(() => {
    console.log("Selected category in CategoryScrollBar:", selected);
    console.log("Selected subcategory in CategoryScrollBar:", selectedSubcategory);
    
    // Use categories data from the hook, or fetch from service_providers as fallback
    if (categoriesData && categoriesData.length > 0) {
      setCategories(["All", ...categoriesData.map(cat => cat.name)]);
      
      // Find the current category id if we have a selected category
      if (selected && selected !== "All") {
        const normalizedSelected = normalizeCategory(selected);
        console.log("Looking for category ID for:", normalizedSelected);
        
        const selectedCategory = categoriesData.find(
          cat => normalizeCategory(cat.name) === normalizedSelected
        );
        
        console.log("Found category:", selectedCategory);
        
        if (selectedCategory) {
          console.log("Setting current category ID to:", selectedCategory.id);
          setCurrentCategoryId(selectedCategory.id);
        } else {
          console.log("Category ID not found for:", selected);
          setCurrentCategoryId(undefined);
        }
      } else {
        setCurrentCategoryId(undefined);
      }
    } else {
      console.log("No categories data yet, fetching from service_providers");
      fetchCategoriesFromServiceProviders();
    }
  }, [selected, categoriesData]);
  
  const fetchCategoriesFromServiceProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('category')
        .eq('approval_status', 'approved')
        .not('category', 'is', null);
        
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Extract unique categories
        const uniqueCategories = ["All", ...new Set(data.map(item => item.category))];
        console.log("Categories fetched from service_providers:", uniqueCategories);
        setCategories(uniqueCategories);
      }
    } catch (err) {
      console.error('Error in category fetch:', err);
    }
  };
  
  const handleSubcategoryChange = (subcategories: string[]) => {
    console.log("Subcategories selected:", subcategories);
    if (onSubcategorySelect) {
      onSubcategorySelect(subcategories);
    }
  };

  const handleCategorySelect = (cat: string) => {
    console.log("Category selected:", cat);
    onSelect(cat);
    
    if (cat !== selected) {
      // Reset subcategory when changing category
      if (onSubcategorySelect) {
        onSubcategorySelect([]);  // Reset with empty array
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <div
        className={cn(
          "w-full overflow-x-auto scrollbar-none flex gap-3 py-2 px-2",
          className
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex gap-3 min-w-max">
          {categories.map((cat, idx) => {
            // "All" button and color assignment for categories
            const isAll = cat === "All";
            const bgColor = isAll
              ? allButtonBg
              : categoryButtonColors[(idx - 1 + categoryButtonColors.length) % categoryButtonColors.length];
            // Make font dark for very light backgrounds ("All" and "Other" buttons)
            const isVeryLight =
              (isAll || cat === "Other" || bgColor === "bg-[#f1f5f9]" || bgColor === "bg-[#fde68a]");
            const textColor = isVeryLight ? "text-[#555] font-bold" : categoryButtonText;
            
            // Fix the category comparison logic - make it case-insensitive
            const normalizedCat = normalizeCategory(cat);
            const normalizedSelected = normalizeCategory(selected);
            
            const isSelected = isAll 
              ? normalizedSelected === "all" || !selected
              : normalizedSelected === normalizedCat;

            return (
              <button
                key={cat}
                className={cn(
                  buttonShapeStyles,
                  bgColor,
                  borderStyle,
                  textColor,
                  depthShadow,
                  isSelected ? selectedStyles : idleStyles,
                  "break-words justify-between"
                )}
                onClick={() => handleCategorySelect(cat)}
                type="button"
                aria-label={cat}
                style={{
                  boxShadow: "0px 4px 18px rgba(22,25,34,0.11)",
                }}
              >
                <span className="block truncate">{cat}</span>
                {!isAll && onSubcategorySelect && (
                  <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Enhanced Subcategory selector with better visibility */}
      {selected !== 'All' && !!currentCategoryId && onSubcategorySelect && (
        <div className="px-2 animate-fadeIn">
          <div className="relative">
            <SubcategorySelector
              categoryId={currentCategoryId}
              value={selectedSubcategory}
              onChange={handleSubcategoryChange}
              className="w-full"
            />
            
            {selectedSubcategory && selectedSubcategory.length > 0 && (
              <div className="mt-2 flex items-center justify-center">
                <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Currently viewing: {selectedSubcategory.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryScrollBar;
