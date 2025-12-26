import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Train, Bus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { TrainServicesGrid } from "@/components/TrainServicesGrid";

// Security: Search validation schema
const searchSchema = z.object({
  from: z.string()
    .trim()
    .min(2, "Origin must be at least 2 characters")
    .max(100, "Origin must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Location can only contain letters and spaces"),
  to: z.string()
    .trim()
    .min(2, "Destination must be at least 2 characters")
    .max(100, "Destination must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Location can only contain letters and spaces"),
  date: z.string()
    .refine((d) => !isNaN(Date.parse(d)), "Invalid date format")
    .refine((d) => {
      const selectedDate = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, "Date cannot be in the past")
    .refine((d) => {
      const selectedDate = new Date(d);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      return selectedDate <= maxDate;
    }, "Cannot book more than 1 year in advance"),
  passengers: z.number()
    .int("Must be a whole number")
    .min(1, "At least 1 passenger required")
    .max(9, "Maximum 9 passengers allowed")
});

export default function BookTransport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("flights");
  const [loading, setLoading] = useState(false);
  
  // Search form state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  
  // Results state
  const [flights, setFlights] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);

  const handleSearch = async () => {
    // Security: Validate search parameters
    const validation = searchSchema.safeParse({
      from,
      to,
      date,
      passengers: parseInt(passengers) || 1
    });

    if (!validation.success) {
      toast({
        title: "Invalid Search",
        description: validation.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const validatedData = validation.data;
      let functionName = '';
      let setResults: (data: any[]) => void = () => {};
      
      if (activeTab === 'flights') {
        functionName = 'search-flights';
        setResults = setFlights;
      } else if (activeTab === 'trains') {
        functionName = 'search-trains';
        setResults = setTrains;
      } else if (activeTab === 'buses') {
        functionName = 'search-buses';
        setResults = setBuses;
      }

      // Use validated data
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          from: validatedData.from, 
          to: validatedData.to, 
          date: validatedData.date, 
          passengers: validatedData.passengers 
        }
      });

      if (error) throw error;

      const resultsKey = activeTab === 'flights' ? 'flights' : activeTab === 'trains' ? 'trains' : 'buses';
      setResults(data[resultsKey] || []);
      
      toast({
        title: "Search Complete",
        description: `Found ${data[resultsKey]?.length || 0} options`,
      });
    } catch (error: any) {
      // Security: Don't log detailed errors
      toast({
        title: "Search Failed",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookFlight = (flight: any) => {
    navigate('/book-confirm', { 
      state: { 
        bookingType: 'flight',
        booking: flight 
      } 
    });
  };

  const handleBookTrain = (train: any, classType: string) => {
    navigate('/book-confirm', { 
      state: { 
        bookingType: 'train',
        booking: { ...train, selectedClass: classType }
      } 
    });
  };

  const handleBookBus = (bus: any) => {
    navigate('/book-confirm', { 
      state: { 
        bookingType: 'bus',
        booking: bus
      } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Book Your Journey</h1>
          <p className="text-muted-foreground">Search and book flights, trains, buses, and hotels</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="flights" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Flights
            </TabsTrigger>
            <TabsTrigger value="trains" className="flex items-center gap-2">
              <Train className="h-4 w-4" />
              Trains
            </TabsTrigger>
            <TabsTrigger value="buses" className="flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Buses
            </TabsTrigger>
            <TabsTrigger value="my-tickets" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              My Tickets
            </TabsTrigger>
          </TabsList>

          {/* Search Form */}
          {activeTab !== 'my-tickets' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Search {activeTab === 'flights' ? 'Flights' : activeTab === 'trains' ? 'Trains' : 'Buses'}</CardTitle>
                <CardDescription>Enter your travel details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="from">From</Label>
                    <Input
                      id="from"
                      placeholder="e.g., Delhi"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to">To</Label>
                    <Input
                      id="to"
                      placeholder="e.g., Mumbai"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  {activeTab === 'flights' && (
                    <div>
                      <Label htmlFor="passengers">Passengers</Label>
                      <Input
                        id="passengers"
                        type="number"
                        min="1"
                        value={passengers}
                        onChange={(e) => setPassengers(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex items-end">
                    <Button onClick={handleSearch} disabled={loading} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      {loading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <TabsContent value="flights">
            <div className="space-y-4">
              {flights.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Search for flights to see available options
                  </CardContent>
                </Card>
              ) : (
                flights.map((flight) => (
                  <Card key={flight.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-semibold text-lg">{flight.airline}</h3>
                            <span className="text-sm text-muted-foreground">{flight.flightNumber}</span>
                          </div>
                          <div className="flex items-center gap-8">
                            <div>
                              <p className="text-2xl font-bold">{flight.departureTime}</p>
                              <p className="text-sm text-muted-foreground">{flight.fromCode}</p>
                            </div>
                            <div className="text-center flex-1">
                              <p className="text-sm text-muted-foreground">{flight.duration}</p>
                              <div className="h-px bg-border my-2" />
                              <p className="text-xs text-muted-foreground">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{flight.arrivalTime}</p>
                              <p className="text-sm text-muted-foreground">{flight.toCode}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-8">
                          <p className="text-3xl font-bold text-primary">₹{flight.price.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground mb-4">{flight.seatsAvailable} seats left</p>
                          <Button onClick={() => handleBookFlight(flight)}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trains">
            {/* IRCTC-style Services Grid */}
            <TrainServicesGrid />
            
            <div className="space-y-4">
              {trains.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Search for trains to see available options
                  </CardContent>
                </Card>
              ) : (
                trains.map((train) => (
                  <Card key={train.id}>
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold text-lg">{train.name}</h3>
                          <span className="text-sm text-muted-foreground">({train.trainNumber})</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <div>
                            <p className="text-2xl font-bold">{train.departureTime}</p>
                            <p className="text-sm text-muted-foreground">{train.from}</p>
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-sm text-muted-foreground">{train.duration}</p>
                            <div className="h-px bg-border my-2" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{train.arrivalTime}</p>
                            <p className="text-sm text-muted-foreground">{train.to}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {Object.entries(train.classes).map(([className, classData]: [string, any]) => (
                          <Card key={className} className="border-2">
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="font-semibold">{className}</p>
                                <p className="text-2xl font-bold text-primary my-2">₹{classData.price}</p>
                                <p className="text-xs text-muted-foreground mb-3">{classData.available} available</p>
                                <Button 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => handleBookTrain(train, className)}
                                  disabled={classData.available === 0}
                                >
                                  Book
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="buses">
            <div className="space-y-4">
              {buses.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Search for buses to see available options
                  </CardContent>
                </Card>
              ) : (
                buses.map((bus) => (
                  <Card key={bus.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-semibold text-lg">{bus.operator}</h3>
                            <span className="text-sm text-muted-foreground">{bus.busType}</span>
                            <span className="text-sm text-yellow-600">★ {bus.rating}</span>
                          </div>
                          <div className="flex items-center gap-8 mb-3">
                            <div>
                              <p className="text-2xl font-bold">{bus.departureTime}</p>
                              <p className="text-sm text-muted-foreground">{bus.from}</p>
                            </div>
                            <div className="text-center flex-1">
                              <p className="text-sm text-muted-foreground">{bus.duration}</p>
                              <div className="h-px bg-border my-2" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{bus.arrivalTime}</p>
                              <p className="text-sm text-muted-foreground">{bus.to}</p>
                            </div>
                          </div>
                          {bus.amenities.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {bus.amenities.map((amenity: string) => (
                                <span key={amenity} className="text-xs bg-secondary px-2 py-1 rounded">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-8">
                          <p className="text-3xl font-bold text-primary">₹{bus.price.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground mb-4">{bus.seatsAvailable} seats left</p>
                          <Button onClick={() => handleBookBus(bus)}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-tickets">
            <Card>
              <CardContent className="p-8">
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Your Booked Tickets</h3>
                  <p className="text-muted-foreground mb-4">
                    View all your booked flights, trains, and bus tickets here
                  </p>
                  <Button onClick={() => navigate("/my-tickets")}>
                    View All Tickets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
