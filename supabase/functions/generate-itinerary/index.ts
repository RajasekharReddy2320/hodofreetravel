import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const itineraryRequestSchema = z.object({
  currentLocation: z.string().trim().min(2).max(100).optional(),
  destination: z.string().trim().min(2).max(100),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid start date'),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid end date'),
  budgetINR: z.number().positive().max(10000000).optional().nullable(),
  budget: z.string().optional(),
  groupSize: z.number().int().min(1).max(50).optional(),
  travelers: z.number().int().min(1).max(50).optional(),
  interests: z.array(z.string().max(50)).max(20),
  plannerMode: z.enum(['comfort', 'time', 'budget']).optional(),
  tripType: z.enum(['tourism', 'commute']).optional(),
  generateMultiple: z.boolean().optional(),
  generateBudgetOptions: z.boolean().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    const validation = itineraryRequestSchema.safeParse(requestData);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          details: validation.error.issues[0].message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      currentLocation, 
      destination, 
      startDate, 
      endDate, 
      budgetINR, 
      budget,
      groupSize, 
      travelers,
      interests, 
      plannerMode = 'comfort',
      tripType = 'tourism',
      generateMultiple = true,
      generateBudgetOptions = false
    } = validation.data;
    
    const actualGroupSize = groupSize || travelers || 1;
    const actualBudget = budget || (budgetINR ? `₹${budgetINR}` : null);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return new Response(
        JSON.stringify({ error: 'End date must be after start date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (tripDays > 60) {
      return new Response(
        JSON.stringify({ error: 'Trip duration cannot exceed 60 days' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Itinerary Request]', {
      destination,
      tripType,
      duration_days: tripDays,
      generateBudgetOptions,
      timestamp: new Date().toISOString()
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error('[Config Error] LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Lovable AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let modeDescription = "balanced";
    if (plannerMode === 'comfort') {
      modeDescription = "comfort-focused with premium experiences, luxury stays, and relaxation";
    } else if (plannerMode === 'time') {
      modeDescription = "time-optimized with efficient scheduling and maximum activities";
    } else if (plannerMode === 'budget') {
      modeDescription = "budget-friendly with cost-effective options and money-saving tips";
    }

    const systemPrompt = `You are a travel planning AI that creates detailed, bookable trip itineraries in JSON format.
Return ONLY valid JSON with no additional text. The response must be a valid JSON object.
All costs should be in INR (Indian Rupees).`;

    let userPrompt = '';

    if (tripType === 'commute') {
      // Commute mode: Focus on multimodal transport logistics
      userPrompt = `Create a multimodal travel plan for ${actualGroupSize} traveler(s) from ${currentLocation || 'Origin'} to ${destination}.

Trip Details:
- Origin: ${currentLocation || 'Not specified'}
- Destination: ${destination}
- Travel Date: ${startDate}
- Return Date: ${endDate}
- Budget: ${actualBudget || 'Flexible - provide multiple options'}

This is a COMMUTE/GENERAL trip, NOT tourism. Focus ONLY on:
1. The most efficient way to get from Point A to Point B
2. Consider multimodal options: flights, trains, buses, and interconnections
3. If direct flights are unavailable, calculate complex routes (e.g., flight to nearest airport → train to city → bus to final destination)
4. Include waiting times, transfer logistics, and total journey duration

${!actualBudget ? `Since no budget was specified, generate 4 DISTINCT transport options:
1. "Minimum Cost" - Cheapest possible route (may involve more transfers/time)
2. "Economy" - Good balance of cost and comfort
3. "Standard" - Comfortable travel with reasonable speed
4. "Maximum Comfort" - Fastest/most luxurious options available

Each option should have genuinely different routes and transport modes.` : 'Generate the optimal route within the specified budget.'}

Return a JSON object with this structure:
{
  "itineraries": [
    {
      "id": "unique-id",
      "title": "Route Name (e.g., 'Budget Route via Train')",
      "subtitle": "Brief description",
      "reason": "Why choose this route (1-2 sentences)",
      "estimatedTotalCost": 5000,
      "totalDuration": "12 hours",
      "steps": [
        {
          "id": "step-id",
          "day": 1,
          "time": "06:00",
          "title": "Flight/Train/Bus Name",
          "description": "Departure and arrival details",
          "location": "Station/Airport name",
          "duration": "3 hours",
          "category": "transport",
          "transportType": "flight|train|bus|metro|taxi",
          "isBookable": true,
          "estimatedCost": 3000,
          "fromStation": "Mumbai Central",
          "toStation": "Ahmedabad Junction"
        }
      ]
    }
  ]
}

Include realistic Indian transport options (Indian Railways, IndiGo, SpiceJet, RedBus operators, etc.).`;

    } else {
      // Tourism mode: Standard sightseeing itinerary
      const itineraryCount = generateBudgetOptions ? 4 : (generateMultiple ? 4 : 1);
      
      userPrompt = `Create ${itineraryCount} DIFFERENT trip itinerary options for ${actualGroupSize} traveler(s) ${currentLocation ? `traveling from ${currentLocation} to ` : 'visiting '}${destination}.

Trip Details:
- ${currentLocation ? `Departure: ${currentLocation}` : 'No departure city specified'}
- Destination: ${destination}
- Dates: ${startDate} to ${endDate} (${tripDays} days)
- Budget: ${actualBudget || 'Not specified - generate options from minimum to luxury'}
- Interests: ${interests.join(", ")}
- Planning Style: ${modeDescription}

${generateBudgetOptions && !actualBudget ? `Since no budget was provided, generate 4 DISTINCT itineraries with different budget levels:
1. "Minimum Cost" - Backpacker style, hostels, street food, free attractions (~₹15,000-25,000)
2. "Economy" - Budget hotels, local restaurants, mix of paid/free activities (~₹30,000-50,000)
3. "Standard" - 3-star hotels, good restaurants, popular attractions (~₹60,000-90,000)
4. "Luxury" - Premium hotels, fine dining, exclusive experiences (~₹1,20,000+)

Each budget tier should have genuinely different experiences and accommodations.` : `Generate ${itineraryCount} DISTINCT itinerary options with different themes:
1. "Classic Explorer" - Popular attractions and must-see spots
2. "Hidden Gems" - Off-the-beaten-path experiences and local secrets
3. "Adventure Seeker" - Active and adventurous activities
4. "Relaxed Retreat" - Leisurely pace with comfort focus

Each itinerary should feel genuinely different, not just reordered activities.`}

${currentLocation ? `IMPORTANT: Include transport from ${currentLocation} to ${destination} as the first step and return transport as the last step.` : ''}

Return a JSON object with this structure:
{
  "itineraries": [
    {
      "id": "unique-id",
      "title": "Itinerary Theme Title",
      "subtitle": "Brief tagline",
      "reason": "Why this itinerary is great (1-2 sentences)",
      "estimatedTotalCost": 50000,
      "budgetTier": "economy",
      "steps": [
        {
          "id": "step-unique-id",
          "day": 1,
          "time": "09:00",
          "title": "Activity title",
          "description": "Brief description (1-2 sentences)",
          "location": "Specific location name in ${destination}",
          "duration": "2 hours",
          "category": "activity",
          "isBookable": true,
          "estimatedCost": 2000
        }
      ]
    }
  ]
}

Categories must be: transport, accommodation, activity, food, sightseeing
Include 4-6 steps per day with realistic INR costs.
Each step must have a unique id (use format: itinerary-index-day-step, e.g., "1-d1-s1").`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI API Error]', {
        status: response.status,
        error: errorText,
        timestamp: new Date().toISOString()
      });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a few minutes before trying again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate itinerary. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('[AI Response] Itinerary generated successfully');
    
    let content = data.choices[0].message.content;
    
    content = content.trim();
    if (content.includes('```json')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (content.includes('```')) {
      content = content.replace(/```\n?/g, '');
    }
    content = content.trim();
    
    const parsedResponse = JSON.parse(content);
    
    if (!parsedResponse.itineraries || !Array.isArray(parsedResponse.itineraries)) {
      throw new Error('Invalid itinerary format: missing itineraries array');
    }
    
    console.log('[Validation] Generated', parsedResponse.itineraries.length, 'itineraries');

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[Server Error]', {
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate itinerary' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
