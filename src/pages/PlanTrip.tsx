import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, IndianRupee, MapPin, Sparkles, Users, Zap, Clock, Wallet, Check, ArrowRight, Plane, MapPinned, Briefcase, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/DashboardNav";
import { useCart } from "@/contexts/CartContext";

const INTEREST_OPTIONS = [
  "Adventure", "Culture", "Food", "Nature", "History", 
  "Beach", "Shopping", "Nightlife", "Museums", "Photography"
];

type TripType = 'tourism' | 'commute';
type PlannerMode = 'comfort' | 'time' | 'budget';

const TRIP_TYPES = [
  {
    value: 'tourism' as TripType,
    icon: MapPinned,
    title: 'Tourism',
    description: 'Sightseeing, points of interest & leisure travel',
    color: 'text-emerald-500'
  },
  {
    value: 'commute' as TripType,
    icon: Briefcase,
    title: 'General/Commute',
    description: 'Point A to B logistics, meetings, efficient travel',
    color: 'text-blue-500'
  }
];

const PLANNER_MODES = [
  {
    value: 'comfort' as PlannerMode,
    icon: Sparkles,
    title: 'Comfort',
    description: 'Premium experiences & relaxation',
    color: 'text-purple-500'
  },
  {
    value: 'time' as PlannerMode,
    icon: Clock,
    title: 'Time Saver',
    description: 'Efficient routing & max activities',
    color: 'text-blue-500'
  },
  {
    value: 'budget' as PlannerMode,
    icon: Wallet,
    title: 'Budget',
    description: 'Cost-effective & value deals',
    color: 'text-green-500'
  }
];

interface SavedItinerary {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  created_at: string;
  planner_mode: string | null;
  trip_type: string;
}

export default function PlanTrip() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart: addToGlobalCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [tripType, setTripType] = useState<TripType>('tourism');
  const [plannerMode, setPlannerMode] = useState<PlannerMode>('comfort');
  const [currentLocation, setCurrentLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetINR, setBudgetINR] = useState("");
  const [groupSize, setGroupSize] = useState("2");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  // Itinerary history
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadItineraryHistory();
  }, []);

  const loadItineraryHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoadingHistory(false);
      return;
    }

    const { data, error } = await supabase
      .from("trips")
      .select("id, title, destination, start_date, end_date, created_at, planner_mode, trip_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setSavedItineraries(data as SavedItinerary[]);
    }
    setLoadingHistory(false);
  };

  const deleteItinerary = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete itinerary", variant: "destructive" });
      return;
    }
    setSavedItineraries(prev => prev.filter(it => it.id !== id));
    toast({ title: "Deleted", description: "Itinerary removed" });
  };

  const detectLocation = () => {
    setDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get city name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || "Your Location";
            setCurrentLocation(city);
            toast({ title: "Location Detected", description: `Origin set to ${city}` });
          } catch {
            setCurrentLocation("Current Location");
            toast({ title: "Location Detected", description: "Using approximate location" });
          }
          setDetectingLocation(false);
        },
        () => {
          toast({ title: "Location Error", description: "Could not detect location", variant: "destructive" });
          setDetectingLocation(false);
        }
      );
    } else {
      toast({ title: "Not Supported", description: "Geolocation not available", variant: "destructive" });
      setDetectingLocation(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGenerate = async () => {
    if (!destination || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill destination and dates.",
        variant: "destructive",
      });
      return;
    }

    if (tripType === 'tourism' && selectedInterests.length === 0) {
      toast({
        title: "Missing Interests",
        description: "Please select at least one interest for tourism trips.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-itinerary', {
        body: {
          currentLocation: currentLocation || undefined,
          destination,
          startDate,
          endDate,
          budgetINR: budgetINR ? parseFloat(budgetINR) : null,
          groupSize: parseInt(groupSize),
          interests: tripType === 'commute' ? ['efficient', 'transport'] : selectedInterests,
          plannerMode,
          tripType,
          generateMultiple: !budgetINR, // Generate 4 options if no budget specified
          generateBudgetOptions: !budgetINR // Flag to generate min-to-max budget options
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.itineraries && data.itineraries.length > 0) {
        navigate('/generated-itineraries', {
          state: {
            itineraries: data.itineraries,
            currentLocation,
            destination,
            tripType
          }
        });
      } else {
        throw new Error("No itineraries generated");
      }
    } catch (error: any) {
      console.error('Error generating itinerary:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate itineraries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="container mx-auto px-4 py-8 pb-32">
        <div className="max-w-5xl mx-auto">
          {/* Itinerary History Section */}
          {savedItineraries.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Recent Itineraries</h2>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-3 pb-4">
                  {savedItineraries.map((itinerary) => (
                    <Card 
                      key={itinerary.id} 
                      className="min-w-[280px] hover:shadow-md transition-shadow cursor-pointer group relative"
                      onClick={() => navigate('/generated-itineraries', { state: { viewTripId: itinerary.id } })}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm truncate max-w-[200px]">{itinerary.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {itinerary.destination}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItinerary(itinerary.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {itinerary.trip_type === 'ai' ? 'AI Generated' : itinerary.trip_type}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles size={14} />
              AI-Powered Planning
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              Plan Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Dream Trip
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {!budgetINR 
                ? "Get 4 unique AI-curated itineraries ranging from budget to luxury. No budget? We'll show you all options!"
                : "Get AI-curated itineraries tailored to your style and budget."
              }
            </p>
          </div>

          {/* Trip Type Selection */}
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-3 block text-center">Trip Type</Label>
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {TRIP_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = tripType === type.value;
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isActive 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                    onClick={() => setTripType(type.value)}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${isActive ? type.color : 'text-muted-foreground'}`} />
                    <p className="font-semibold text-sm">{type.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Planner Mode Selection (Only for Tourism) */}
          {tripType === 'tourism' && (
            <div className="mb-8">
              <Label className="text-sm font-semibold mb-3 block text-center">Planning Style</Label>
              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                {PLANNER_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = plannerMode === mode.value;
                  
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        isActive 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/50 bg-card'
                      }`}
                      onClick={() => setPlannerMode(mode.value)}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${isActive ? mode.color : 'text-muted-foreground'}`} />
                      <p className="font-semibold text-sm">{mode.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{mode.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Form */}
          <Card className="mb-8 shadow-lg border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Plane className="text-primary" size={20} />
                Trip Details
              </CardTitle>
              <CardDescription>
                {tripType === 'commute' 
                  ? "Enter your origin and destination for efficient multimodal routing"
                  : "Tell us about your dream destination"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Locations */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentLocation" className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className="text-primary" />
                    {tripType === 'commute' ? 'Origin *' : 'Departure City'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="currentLocation"
                      placeholder="e.g., Mumbai, India"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      required={tripType === 'commute'}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={detectLocation}
                      disabled={detectingLocation}
                      title="Detect my location"
                    >
                      {detectingLocation ? (
                        <Zap className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPinned className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="destination" className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className="text-destructive" />
                    Destination *
                  </Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Goa, India"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-primary" />
                    Start Date *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-primary" />
                    End Date *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Budget & Group */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetINR" className="flex items-center gap-2 mb-2">
                    <IndianRupee size={14} className="text-primary" />
                    Budget (INR)
                    <span className="text-xs text-muted-foreground ml-1">(optional - leave empty for 4 options)</span>
                  </Label>
                  <Input
                    id="budgetINR"
                    type="number"
                    placeholder="Leave empty for min-to-max options"
                    value={budgetINR}
                    onChange={(e) => setBudgetINR(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="groupSize" className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-primary" />
                    Travelers
                  </Label>
                  <Input
                    id="groupSize"
                    type="number"
                    min="1"
                    value={groupSize}
                    onChange={(e) => setGroupSize(e.target.value)}
                  />
                </div>
              </div>

              {/* Interests (Only for Tourism) */}
              {tripType === 'tourism' && (
                <div>
                  <Label className="mb-3 block">Interests *</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => (
                      <Badge
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer transition-all hover:scale-105 py-1.5 px-3"
                        onClick={() => toggleInterest(interest)}
                      >
                        {selectedInterests.includes(interest) && <Check size={12} className="mr-1" />}
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-6 text-lg font-bold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Zap className="mr-2 h-5 w-5 animate-spin" />
                    {!budgetINR ? "Generating 4 Budget Options..." : "Generating Itinerary..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {!budgetINR ? "Generate 4 Budget Options (Min to Luxury)" : "Generate Itinerary"}
                  </>
                )}
              </Button>

              {!budgetINR && (
                <p className="text-center text-sm text-muted-foreground">
                  Without a budget, we'll generate: <span className="font-medium">Minimum Cost</span> → <span className="font-medium">Economy</span> → <span className="font-medium">Standard</span> → <span className="font-medium">Luxury</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
