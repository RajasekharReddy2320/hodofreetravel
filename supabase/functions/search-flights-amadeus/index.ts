import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const searchSchema = z.object({
  from: z.string().trim().min(2).max(100),
  to: z.string().trim().min(2).max(100),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  passengers: z.number().int().min(1).max(9).optional().default(1),
  returnDate: z.string().optional(),
});

// IATA airport codes for major Indian cities
const airportCodes: Record<string, string> = {
  'delhi': 'DEL', 'new delhi': 'DEL',
  'mumbai': 'BOM', 'bombay': 'BOM',
  'bangalore': 'BLR', 'bengaluru': 'BLR', 'banglore': 'BLR',
  'chennai': 'MAA', 'madras': 'MAA',
  'kolkata': 'CCU', 'calcutta': 'CCU',
  'hyderabad': 'HYD', 'hyb': 'HYD',
  'ahmedabad': 'AMD',
  'pune': 'PNQ',
  'jaipur': 'JAI',
  'lucknow': 'LKO',
  'kochi': 'COK', 'cochin': 'COK',
  'goa': 'GOI',
  'guwahati': 'GAU',
  'ranchi': 'IXR',
  'patna': 'PAT',
  'bhubaneswar': 'BBI',
  'chandigarh': 'IXC',
  'srinagar': 'SXR',
  'thiruvananthapuram': 'TRV', 'trivandrum': 'TRV',
  'varanasi': 'VNS',
  'indore': 'IDR',
  'nagpur': 'NAG',
  'coimbatore': 'CJB',
  'visakhapatnam': 'VTZ', 'vizag': 'VTZ',
  'raipur': 'RPR',
  'mangalore': 'IXE',
  'amritsar': 'ATQ',
  'udaipur': 'UDR',
  'mysore': 'MYQ', 'mysuru': 'MYQ',
  'bhopal': 'BHO',
  'madurai': 'IXM',
  'leh': 'IXL',
  'imphal': 'IMF',
  'agartala': 'IXA',
  'port blair': 'IXZ',
  'dehradun': 'DED',
  'jammu': 'IXJ',
  'rajkot': 'RAJ',
  'vadodara': 'BDQ', 'baroda': 'BDQ',
  'surat': 'STV',
  'bagdogra': 'IXB',
  'siliguri': 'IXB',
  'jodhpur': 'JDH',
  'aurangabad': 'IXU',
  'tirupati': 'TIR',
  'vijayawada': 'VGA',
  'hubli': 'HBX',
  'belgaum': 'IXG',
};

function getAirportCode(city: string): string {
  const normalized = city.toLowerCase().trim();
  // Check for exact matches first
  if (airportCodes[normalized]) {
    return airportCodes[normalized];
  }
  // Check for partial matches
  for (const [key, code] of Object.entries(airportCodes)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return code;
    }
  }
  // Return first 3 letters as fallback
  return normalized.slice(0, 3).toUpperCase();
}

// Get Amadeus access token (TEST environment)
async function getAmadeusToken(apiKey: string, apiSecret: string): Promise<string> {
  const host = 'test.api.amadeus.com';
  console.log('[Amadeus Auth Host]', { host });
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: apiKey,
    client_secret: apiSecret,
  }).toString();

  const response = await fetch(`https://${host}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    console.error('[Amadeus Auth Error]', { host, error: text });
    throw new Error('Failed to authenticate with Amadeus');
  }

  const data = JSON.parse(text);
  return data.access_token as string;
}

// Search flights using Amadeus API
async function searchFlightsAmadeus(
  token: string,
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number
) {
  const params = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    adults: passengers.toString(),
    currencyCode: 'INR',
    max: '20',
  });

  const response = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[Amadeus Flight Search Error]', error);
    throw new Error('Failed to search flights');
  }

  return response.json();
}

// Parse Amadeus response to our format
function parseFlightOffers(data: any, fromCity: string, toCity: string) {
  if (!data.data || data.data.length === 0) {
    return [];
  }

  const dictionaries = data.dictionaries || {};
  const carriers = dictionaries.carriers || {};

  return data.data.map((offer: any, index: number) => {
    const firstSegment = offer.itineraries?.[0]?.segments?.[0];
    const lastSegment = offer.itineraries?.[0]?.segments?.slice(-1)[0];
    const segments = offer.itineraries?.[0]?.segments || [];

    // Calculate total duration
    const totalDuration = offer.itineraries?.[0]?.duration || 'PT0H0M';
    const durationMatch = totalDuration.match(/PT(\d+)H(\d+)?M?/);
    const hours = durationMatch?.[1] || '0';
    const minutes = durationMatch?.[2] || '0';
    const formattedDuration = `${hours}h ${minutes}m`;

    // Get carrier info
    const carrierCode = firstSegment?.carrierCode || '';
    const carrierName = carriers[carrierCode] || carrierCode;
    const flightNumber = `${carrierCode} ${firstSegment?.number || ''}`;

    // Parse times
    const departureTime = firstSegment?.departure?.at?.split('T')[1]?.slice(0, 5) || '00:00';
    const arrivalTime = lastSegment?.arrival?.at?.split('T')[1]?.slice(0, 5) || '00:00';

    // Get price
    const price = Math.round(parseFloat(offer.price?.total || '0'));

    return {
      id: `FL${offer.id || index + 1}`,
      airline: carrierName,
      flightNumber,
      from: fromCity,
      to: toCity,
      fromCode: firstSegment?.departure?.iataCode || '',
      toCode: lastSegment?.arrival?.iataCode || '',
      departureTime,
      arrivalTime,
      duration: formattedDuration,
      stops: segments.length - 1,
      price,
      seatsAvailable: offer.numberOfBookableSeats || Math.floor(Math.random() * 20) + 5,
      date: firstSegment?.departure?.at?.split('T')[0] || '',
      cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
      bookingClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.class || 'Y',
    };
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('AMADEUS_API_KEY');
    const apiSecret = Deno.env.get('AMADEUS_API_SECRET');

    if (!apiKey || !apiSecret) {
      console.error('[Config Error] Missing Amadeus API credentials');
      return new Response(
        JSON.stringify({ error: 'Flight search service is not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    
    // Validate inputs
    const validation = searchSchema.safeParse(requestData);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid search parameters',
          details: validation.error.issues[0].message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { from, to, date, passengers } = validation.data;
    
    // Convert city names to airport codes
    const originCode = getAirportCode(from);
    const destinationCode = getAirportCode(to);

    console.log('[Flight Search]', {
      route: `${from} (${originCode}) -> ${to} (${destinationCode})`,
      date,
      passengers,
      timestamp: new Date().toISOString()
    });

    // Get Amadeus token (TEST env)
    const token = await getAmadeusToken(apiKey, apiSecret);

    // Search flights
    const amadeusData = await searchFlightsAmadeus(
      token,
      originCode,
      destinationCode,
      date,
      passengers || 1
    );

    // Parse results
    const flights = parseFlightOffers(amadeusData, from, to);

    console.log('[Flight Search Complete]', { count: flights.length });

    return new Response(
      JSON.stringify({ flights }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[Flight Search Error]', {
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ error: 'Failed to search flights. Please try again.' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
