import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Plane, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Airport {
  iataCode: string;
  name: string;
  cityName: string;
  countryName: string;
  countryCode: string;
  type: string;
  detailedName: string;
}

interface AirportAutocompleteProps {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, airport?: Airport) => void;
  className?: string;
}

export function AirportAutocomplete({
  id,
  placeholder = "Search airport or city...",
  value,
  onChange,
  className,
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync with external value changes
  useEffect(() => {
    if (value !== query && !selectedAirport) {
      setQuery(value);
    }
  }, [value]);

  const searchAirports = async (keyword: string) => {
    if (keyword.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-airports", {
        body: { keyword },
      });

      if (error) throw error;
      setSuggestions(data?.locations || []);
    } catch (error) {
      console.error("Airport search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedAirport(null);
    onChange(newValue);
    setIsOpen(true);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchAirports(newValue);
    }, 300);
  };

  const handleSelect = (airport: Airport) => {
    const displayValue = `${airport.cityName} (${airport.iataCode})`;
    setQuery(displayValue);
    setSelectedAirport(airport);
    onChange(airport.iataCode, airport);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0 || query.length >= 2) {
              setIsOpen(true);
              if (query.length >= 2 && suggestions.length === 0) {
                searchAirports(query);
              }
            }
          }}
          className="pr-10"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : selectedAirport ? (
            <span className="text-xs font-medium text-primary">{selectedAirport.iataCode}</span>
          ) : (
            <Plane className="h-4 w-4" />
          )}
        </div>
      </div>

      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {isLoading && suggestions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Searching airports...
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.map((airport) => (
                <li
                  key={`${airport.iataCode}-${airport.type}`}
                  onClick={() => handleSelect(airport)}
                  className="cursor-pointer px-3 py-2 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted-foreground">
                      {airport.type === "AIRPORT" ? (
                        <Plane className="h-4 w-4" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {airport.cityName}
                        </span>
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {airport.iataCode}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {airport.name}, {airport.countryName}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
