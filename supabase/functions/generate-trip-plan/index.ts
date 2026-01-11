import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentLocation, destination, startDate, endDate, travelers, budget, interests } = await req.json();
    
    console.log("Generating trip plan:", { currentLocation, destination, startDate, endDate, travelers, budget, interests });
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const numDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const systemPrompt = `You are a travel planning AI. Generate detailed trip itineraries in JSON format.
Return ONLY valid JSON with no additional text. The response must be a valid JSON object.`;

    const userPrompt = `Create a ${numDays}-day trip itinerary for ${travelers} traveler(s) traveling from ${currentLocation} to ${destination}.
Departure city: ${currentLocation}
Destination: ${destination}
Budget level: ${budget}
Interests: ${interests.join(", ")}
Travel dates: ${startDate} to ${endDate}

IMPORTANT: The first step should be the transport (flight/train/bus) FROM ${currentLocation} TO ${destination}. Include specific departure station/airport in ${currentLocation} and arrival station/airport in ${destination}.
The last step should be the return transport FROM ${destination} TO ${currentLocation}.

Return a JSON object with this exact structure:
{
  "title": "Trip title",
  "reason": "Brief reason why this is a great trip (1 sentence)",
  "steps": [
    {
      "id": "unique-id-1",
      "day": 1,
      "time": "09:00",
      "title": "Activity title",
      "description": "Brief description of the activity",
      "location": "Specific location name",
      "coordinates": { "lat": 0.0, "lng": 0.0 },
      "duration": "2 hours",
      "category": "activity",
      "isBookable": true,
      "estimatedCost": 2000
    }
  ]
}

Categories must be one of: transport, accommodation, activity, food, sightseeing
Include 4-6 steps per day. Use realistic costs in INR.
Make sure each step has a unique id.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the response
    let tripPlan;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      tripPlan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse trip plan");
    }

    return new Response(JSON.stringify(tripPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating trip plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
