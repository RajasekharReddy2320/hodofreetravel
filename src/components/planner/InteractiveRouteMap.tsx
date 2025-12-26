import React, { useEffect, useRef, useState } from 'react';
import { ItineraryStep } from '@/types/tripPlanner';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface InteractiveRouteMapProps {
  steps: ItineraryStep[];
  currentLocation?: string;
  destination?: string;
}

interface GeocodedLocation {
  name: string;
  lat: number;
  lng: number;
}

const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({ 
  steps, 
  currentLocation,
  destination 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [locations, setLocations] = useState<GeocodedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [mapError, setMapError] = useState(false);

  // Extract unique locations from steps
  const uniqueLocations = steps.reduce((acc, step) => {
    const lastLoc = acc.length > 0 ? acc[acc.length - 1] : null;
    if (step.location && step.location !== lastLoc) {
      acc.push(step.location);
    }
    return acc;
  }, [] as string[]);

  // Filter to focus on destination area
  let displayLocations: string[] = [];
  if (uniqueLocations.length > 1) {
    const startLocation = uniqueLocations[0];
    let trimmed = uniqueLocations.slice(1);
    if (trimmed.length > 0 && trimmed[trimmed.length - 1] === startLocation) {
      trimmed.pop();
    }
    displayLocations = trimmed;
  } else {
    displayLocations = uniqueLocations;
  }

  useEffect(() => {
    const geocodeLocations = async () => {
      setLoading(true);
      try {
        const geocoded: GeocodedLocation[] = [];
        
        for (const loc of displayLocations.slice(0, 10)) { // Limit to 10 locations
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`
            );
            const data = await response.json();
            if (data && data.length > 0) {
              geocoded.push({
                name: loc,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              });
            }
            // Rate limiting for Nominatim
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error(`Failed to geocode: ${loc}`);
          }
        }
        
        setLocations(geocoded);
      } catch (err) {
        setMapError(true);
      } finally {
        setLoading(false);
      }
    };

    if (displayLocations.length > 0) {
      geocodeLocations();
    } else {
      setLoading(false);
    }
  }, [steps]);

  if (displayLocations.length === 0) {
    return null;
  }

  // Calculate center and bounds for the embedded map
  const getMapCenter = () => {
    if (locations.length === 0) {
      return displayLocations[0] || destination || '';
    }
    
    // Use the first location as center
    return `${locations[0].lat},${locations[0].lng}`;
  };

  // Build Google Maps embed URL with markers
  const buildMapUrl = () => {
    if (locations.length === 0) {
      // Fallback to search-based embed
      const query = displayLocations.slice(0, 3).join(' | ');
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=12`;
    }

    if (locations.length === 1) {
      return `https://maps.google.com/maps?q=${locations[0].lat},${locations[0].lng}&output=embed&z=14`;
    }

    // Create directions URL for multiple locations
    const origin = encodeURIComponent(locations[0].name);
    const dest = encodeURIComponent(locations[locations.length - 1].name);
    const waypoints = locations.slice(1, -1).map(l => encodeURIComponent(l.name)).join('|');
    
    if (waypoints) {
      return `https://maps.google.com/maps?saddr=${origin}&daddr=${dest}&waypoints=${waypoints}&output=embed`;
    }
    
    return `https://maps.google.com/maps?saddr=${origin}&daddr=${dest}&output=embed`;
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden shadow-lg border border-border mb-10 bg-card">
      {/* Map Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Trip Route Map</h3>
          <Badge variant="secondary" className="text-xs">
            {displayLocations.length} stops
          </Badge>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading locations...
          </div>
        )}
      </div>

      {/* Location Pills */}
      <div className="p-3 border-b bg-background overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {displayLocations.map((loc, idx) => (
            <Button
              key={idx}
              variant={selectedLocation === idx ? "default" : "outline"}
              size="sm"
              className="gap-1.5 whitespace-nowrap"
              onClick={() => setSelectedLocation(selectedLocation === idx ? null : idx)}
            >
              <MapPin className="h-3 w-3" />
              <span className="text-xs font-medium">{idx + 1}.</span>
              {loc}
            </Button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[400px] md:h-[450px] bg-muted">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Preparing route map...</p>
            </div>
          </div>
        ) : mapError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Unable to load map</p>
            </div>
          </div>
        ) : (
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={buildMapUrl()}
            title="Trip Route Map"
            className="grayscale-[10%] hover:grayscale-0 transition-all duration-500"
          />
        )}
        
        {/* Map Overlay Badge */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-full shadow-sm text-muted-foreground pointer-events-none flex items-center gap-1">
          <Navigation className="h-3 w-3" />
          Interactive Map
        </div>
      </div>

      {/* Route Summary */}
      {locations.length > 1 && (
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4 text-green-500" />
              <span>{displayLocations[0]}</span>
            </div>
            <div className="flex-1 h-px bg-border relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                {displayLocations.length - 2 > 0 && `+${displayLocations.length - 2} stops`}
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4 text-red-500" />
              <span>{displayLocations[displayLocations.length - 1]}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveRouteMap;