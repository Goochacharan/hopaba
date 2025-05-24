import React, { useState, useEffect, useRef } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { getUserLocation } from '@/lib/locationUtils';
import { useToast } from '@/hooks/use-toast';

interface AreaSearchBarProps {
  onAreaSelect: (area: string) => void;
  selectedArea: string;
  onLocationSelect?: (coordinates: {
    lat: number;
    lng: number;
  } | null) => void;
}

const AreaSearchBar: React.FC<AreaSearchBarProps> = ({
  onAreaSelect,
  selectedArea,
  onLocationSelect
}) => {
  const [open, setOpen] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    toast
  } = useToast();

  useEffect(() => {
    const fetchAreas = async () => {
      const {
        data: serviceProviders,
        error
      } = await supabase.from('service_providers').select('area, city').not('area', 'is', null).not('city', 'is', null);
      if (error) {
        console.error('Error fetching areas:', error);
        return;
      }
      const uniqueAreas = new Set<string>();
      serviceProviders?.forEach(provider => {
        uniqueAreas.add(`${provider.area}, ${provider.city}`);
      });
      setAreas(Array.from(uniqueAreas).sort());
    };
    fetchAreas();
  }, []);

  useEffect(() => {
    if (searchValue) {
      let filtered: string[];
      if (searchValue.toLowerCase() === 'near me' || searchValue.toLowerCase() === 'near' || searchValue.toLowerCase() === 'nearby') {
        filtered = ['Near me (Use my current location)'];
      } else {
        filtered = areas.filter(area => area.toLowerCase().includes(searchValue.toLowerCase()));
      }
      setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setSuggestions([]);
    }
  }, [searchValue, areas]);

  const handleSelect = async (value: string) => {
    if (value === 'Near me (Use my current location)') {
      const userLocation = await getUserLocation();
      if (userLocation) {
        if (onLocationSelect) {
          onLocationSelect(userLocation);
          toast({
            title: "Location detected",
            description: "Using your current location for nearby search results"
          });
        }
        onAreaSelect("Near me");
      } else {
        toast({
          title: "Location access denied",
          description: "Please allow location access or choose a specific area",
          variant: "destructive"
        });
      }
    } else {
      onAreaSelect(value);
      if (onLocationSelect) {
        onLocationSelect(null);
      }
    }
    setSearchValue(value);
    setOpen(false);
  };

  const clearSearch = () => {
    setSearchValue('');
    inputRef.current?.focus();
  };

  const handleInputClick = () => {
    setOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return <div className="w-full px-0 py-0 mb-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative px-[2px] py-[3px]">
            <input ref={inputRef} value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Search by area or city..." className="w-full p-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary cursor-text" onFocus={() => setOpen(true)} onClick={handleInputClick} />
            {searchValue && <X className="absolute right-10 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer" onClick={clearSearch} />}
            <Button variant="default" size="icon" onClick={handleInputClick} className="absolute right-2 top-1 p-1 h-7 w-7 py-0 my-[5px] px-[5px] mx-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          {suggestions.length > 0 && <Command>
              <CommandList>
                <CommandEmpty>No area found.</CommandEmpty>
                <CommandGroup>
                  {suggestions.map(area => <CommandItem key={area} value={area} onSelect={() => handleSelect(area)}>
                      <Check className={cn("mr-2 h-4 w-4", selectedArea === area ? "opacity-100" : "opacity-0")} />
                      {area}
                    </CommandItem>)}
                </CommandGroup>
              </CommandList>
            </Command>}
        </PopoverContent>
      </Popover>
    </div>;
};

export default AreaSearchBar;
