import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AmadeusLocation {
  type: string;
  subType: string;
  name: string;
  detailedName: string;
  id: string;
  iataCode: string;
  address: {
    cityName: string;
    cityCode: string;
    countryName: string;
    countryCode: string;
  };
}

async function getAmadeusToken(): Promise<string> {
  const clientId = Deno.env.get("AMADEUS_API_KEY");
  const clientSecret = Deno.env.get("AMADEUS_API_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Amadeus API credentials not configured");
  }

  const host = "test.api.amadeus.com";

  const tokenResponse = await fetch(`https://${host}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("[Amadeus Token Error]", errorText);
    throw new Error("Failed to authenticate with Amadeus");
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function searchLocations(keyword: string, token: string): Promise<any[]> {
  const host = "test.api.amadeus.com";
  
  const params = new URLSearchParams({
    keyword: keyword,
    subType: "AIRPORT,CITY",
    "page[limit]": "10",
  });

  const response = await fetch(
    `https://${host}/v1/reference-data/locations?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Amadeus Locations Error]", errorText);
    throw new Error("Failed to search locations");
  }

  const data = await response.json();
  
  // Transform to simpler format
  return (data.data || []).map((loc: AmadeusLocation) => ({
    iataCode: loc.iataCode,
    name: loc.name,
    cityName: loc.address?.cityName || loc.name,
    countryName: loc.address?.countryName || "",
    countryCode: loc.address?.countryCode || "",
    type: loc.subType, // AIRPORT or CITY
    detailedName: loc.detailedName || `${loc.name}, ${loc.address?.countryName || ""}`,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword } = await req.json();

    if (!keyword || keyword.length < 2) {
      return new Response(
        JSON.stringify({ locations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Airport Search]", { keyword, timestamp: new Date().toISOString() });

    const token = await getAmadeusToken();
    const locations = await searchLocations(keyword, token);

    console.log("[Airport Search Complete]", { count: locations.length });

    return new Response(
      JSON.stringify({ locations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Airport Search Error]", error.message);
    return new Response(
      JSON.stringify({ error: error.message, locations: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
