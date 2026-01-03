import React from "react";
import { ItineraryStep } from "@/types/tripPlanner";

interface ItineraryMapProps {
  steps: ItineraryStep[];
}

const ItineraryMap: React.FC<ItineraryMapProps> = ({ steps }) => {
  // 1. Get Clean List of Stops
  const uniqueLocations = steps.reduce((acc, step) => {
    if (!step.location) return acc;
    const lastLoc = acc.length > 0 ? acc[acc.length - 1] : null;
    // Prevent duplicate consecutive stops (e.g. Hotel -> Hotel)
    if (step.location !== lastLoc) {
      acc.push(step.location);
    }
    return acc;
  }, [] as string[]);

  // 2. Filter Logic (Same as before)
  // Remove the "Home/Origin" airport so the map focuses on the holiday destination
  let displayLocations: string[] = [];
  if (uniqueLocations.length > 1) {
    const startLocation = uniqueLocations[0];
    let trimmed = uniqueLocations.slice(1);
    if (trimmed.length > 0 && trimmed[trimmed.length - 1] === startLocation) {
      trimmed.pop();
    }
    displayLocations = trimmed.length > 0 ? trimmed : uniqueLocations;
  } else {
    displayLocations = uniqueLocations;
  }

  if (displayLocations.length === 0) return null;

  // 3. The "No-API" URL Construction
  // We use the legacy 'maps?q=' format which is free and public.
  const buildNoApiUrl = () => {
    const baseUrl = "https://maps.google.com/maps";

    // If we only have one place (e.g., just the Hotel)
    if (displayLocations.length === 1) {
      return `${baseUrl}?q=${encodeURIComponent(displayLocations[0])}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    }

    // If we have a route (A -> B -> C)
    // We construct a query like: "from:Ranchi to:Goa to:HotelXYZ"
    // This tricks the Search Engine into showing a route without using the API.

    // Limit to 10 stops to prevent URL length errors
    const safeLocations = displayLocations.slice(0, 10);

    const start = safeLocations[0];
    const others = safeLocations.slice(1);

    // Build string: "from:Start to:Loc1 to:Loc2 to:End"
    let queryString = `from:${start}`;
    others.forEach((loc) => {
      queryString += `+to:${loc}`;
    });

    return `${baseUrl}?q=${encodeURIComponent(queryString)}&t=&z=10&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <div className="w-full h-[250px] sm:h-[350px] lg:h-full lg:min-h-[450px] rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-border bg-muted relative group">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={buildNoApiUrl()}
        title="Trip Route Map"
        className="w-full h-full"
      ></iframe>

      {/* Badge to show it's working */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/90 backdrop-blur-md text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full shadow-sm text-gray-600 pointer-events-none border border-gray-200">
        Route Preview
      </div>
    </div>
  );
};

export default ItineraryMap;
