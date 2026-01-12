import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Train, Bus, Search, Filter, ArrowUpDown, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { TrainServicesGrid } from "@/components/TrainServicesGrid";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";
import { FlightResultCard } from "@/components/FlightResultCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Security: Search validation schema for flights (IATA codes)
const flightSearchSchema = z.object({
  from: z.string()
    .trim()
    .min(3, "Please select an airport")
    .max(3, "Please select an airport")
    .regex(/^[A-Z]{3}$/, "Please select a valid airport"),
  to: z.string()
    .trim()
    .min(3, "Please select an airport")
    .max(3, "Please select an airport")
    .regex(/^[A-Z]{3}$/, "Please select a valid airport"),
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

// Search validation schema for trains/buses (city names)
const generalSearchSchema = z.object({
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
  const [returnDate, setReturnDate] = useState("");
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [passengers, setPassengers] = useState("1");
  
  // Results state
  const [flights, setFlights] = useState<any[]>([]);
  const [returnFlights, setReturnFlights] = useState<any[]>([]);
  const [selectedOutbound, setSelectedOutbound] = useState<any | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [trains, setTrains] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);

  const handleSearch = async () => {
    // Security: Use different validation based on transport type
    const schema = activeTab === 'flights' ? flightSearchSchema : generalSearchSchema;
    const validation = schema.safeParse({
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

    // Validate return date for round trips
    if (activeTab === 'flights' && tripType === 'roundtrip') {
      if (!returnDate) {
        toast({
          title: "Invalid Search",
          description: "Please select a return date",
          variant: "destructive",
        });
        return;
      }
      if (new Date(returnDate) < new Date(date)) {
        toast({
          title: "Invalid Search",
          description: "Return date must be after departure date",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    // Reset selections for round trip
    setSelectedOutbound(null);
    setSelectedReturn(null);
    
    try {
      const validatedData = validation.data;
      
      if (activeTab === 'flights') {
        // Search outbound flights
        const { data: outboundData, error: outboundError } = await supabase.functions.invoke('search-flights', {
          body: { 
            from: validatedData.from, 
            to: validatedData.to, 
            date: validatedData.date, 
            passengers: validatedData.passengers 
          }
        });

        if (outboundError) throw outboundError;
        setFlights(outboundData.flights || []);

        // Search return flights if round trip
        if (tripType === 'roundtrip' && returnDate) {
          const { data: returnData, error: returnError } = await supabase.functions.invoke('search-flights', {
            body: { 
              from: validatedData.to, // Swap origin/destination
              to: validatedData.from, 
              date: returnDate, 
              passengers: validatedData.passengers 
            }
          });

          if (returnError) throw returnError;
          setReturnFlights(returnData.flights || []);
          
          toast({
            title: "Search Complete",
            description: `Found ${outboundData.flights?.length || 0} outbound and ${returnData.flights?.length || 0} return flights`,
          });
        } else {
          setReturnFlights([]);
          toast({
            title: "Search Complete",
            description: `Found ${outboundData.flights?.length || 0} flights`,
          });
        }
      } else {
        // Train/Bus search
        let functionName = activeTab === 'trains' ? 'search-trains' : 'search-buses';
        let setResults = activeTab === 'trains' ? setTrains : setBuses;

        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { 
            from: validatedData.from, 
            to: validatedData.to, 
            date: validatedData.date, 
            passengers: validatedData.passengers 
          }
        });

        if (error) throw error;

        const resultsKey = activeTab === 'trains' ? 'trains' : 'buses';
        setResults(data[resultsKey] || []);
        
        toast({
          title: "Search Complete",
          description: `Found ${data[resultsKey]?.length || 0} options`,
        });
      }
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

  const [sortBy, setSortBy] = useState("price");
  const [filterStops, setFilterStops] = useState("all");

  const handleBookFlight = (flight: any, fareType?: string) => {
    if (tripType === 'roundtrip') {
      // For round trip, track selected flights
      if (!selectedOutbound) {
        setSelectedOutbound({ ...flight, selectedFare: fareType || 'SAVER' });
        toast({
          title: "Outbound Flight Selected",
          description: "Now select your return flight",
        });
        return;
      } else if (!selectedReturn) {
        setSelectedReturn({ ...flight, selectedFare: fareType || 'SAVER' });
      }
    }

    // Navigate to booking with both flights for round trip
    navigate('/book-confirm', { 
      state: { 
        bookingType: 'flight',
        tripType,
        booking: tripType === 'roundtrip' && selectedOutbound 
          ? { 
              outbound: selectedOutbound,
              return: { ...flight, selectedFare: fareType || 'SAVER' }
            }
          : { ...flight, selectedFare: fareType || 'SAVER' }
      } 
    });
  };

  const handleSelectOutbound = (flight: any, fareType?: string) => {
    setSelectedOutbound({ ...flight, selectedFare: fareType || 'SAVER' });
  };

  const handleSelectReturn = (flight: any, fareType?: string) => {
    setSelectedReturn({ ...flight, selectedFare: fareType || 'SAVER' });
  };

  const handleBookRoundTrip = () => {
    if (!selectedOutbound || !selectedReturn) {
      toast({
        title: "Select Both Flights",
        description: "Please select both outbound and return flights",
        variant: "destructive",
      });
      return;
    }

    navigate('/book-confirm', { 
      state: { 
        bookingType: 'flight',
        tripType: 'roundtrip',
        booking: { 
          outbound: selectedOutbound,
          return: selectedReturn
        }
      } 
    });
  };

  // Sort and filter flights
  const getFilteredFlights = (flightList: any[]) => {
    let filtered = [...flightList];
    
    // Filter by stops
    if (filterStops === "nonstop") {
      filtered = filtered.filter(f => f.stops === 0);
    } else if (filterStops === "1stop") {
      filtered = filtered.filter(f => f.stops === 1);
    }

    // Sort
    if (sortBy === "price") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "duration") {
      filtered.sort((a, b) => {
        const aDur = parseInt(a.duration?.replace(/[^\d]/g, '') || '0');
        const bDur = parseInt(b.duration?.replace(/[^\d]/g, '') || '0');
        return aDur - bDur;
      });
    } else if (sortBy === "departure") {
      filtered.sort((a, b) => a.departureTime?.localeCompare(b.departureTime));
    } else if (sortBy === "arrival") {
      filtered.sort((a, b) => a.arrivalTime?.localeCompare(b.arrivalTime));
    }

    return filtered;
  };

  const getTotalRoundTripPrice = () => {
    if (!selectedOutbound || !selectedReturn) return 0;
    return selectedOutbound.price + selectedReturn.price;
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
                {/* Trip Type Toggle for Flights */}
                {activeTab === 'flights' && (
                  <div className="mb-4">
                    <RadioGroup 
                      value={tripType} 
                      onValueChange={(value) => setTripType(value as "oneway" | "roundtrip")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="oneway" id="oneway" />
                        <Label htmlFor="oneway" className="cursor-pointer">One Way</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="roundtrip" id="roundtrip" />
                        <Label htmlFor="roundtrip" className="cursor-pointer flex items-center gap-1">
                          <ArrowLeftRight className="w-4 h-4" />
                          Round Trip
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="lg:col-span-1">
                    <Label htmlFor="from">From</Label>
                    {activeTab === 'flights' ? (
                      <AirportAutocomplete
                        id="from"
                        placeholder="Search airport..."
                        value={from}
                        onChange={(value) => setFrom(value)}
                      />
                    ) : (
                      <Input
                        id="from"
                        placeholder="e.g., Delhi"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="lg:col-span-1">
                    <Label htmlFor="to">To</Label>
                    {activeTab === 'flights' ? (
                      <AirportAutocomplete
                        id="to"
                        placeholder="Search airport..."
                        value={to}
                        onChange={(value) => setTo(value)}
                      />
                    ) : (
                      <Input
                        id="to"
                        placeholder="e.g., Mumbai"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="date">{activeTab === 'flights' && tripType === 'roundtrip' ? 'Departure' : 'Date'}</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {activeTab === 'flights' && tripType === 'roundtrip' && (
                    <div>
                      <Label htmlFor="returnDate">Return</Label>
                      <Input
                        id="returnDate"
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        min={date || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                  {activeTab === 'flights' && (
                    <div>
                      <Label htmlFor="passengers">Travellers</Label>
                      <Select value={passengers} onValueChange={setPassengers}>
                        <SelectTrigger>
                          <SelectValue placeholder="1" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Adult' : 'Adults'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            <div className="space-y-6">
              {flights.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Plane className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium mb-2">Search for Flights</p>
                    <p>Enter your travel details above to find available flights</p>
                  </CardContent>
                </Card>
              ) : tripType === 'roundtrip' ? (
                <>
                  {/* Round Trip Combined View */}
                  {(selectedOutbound || selectedReturn) && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">Selected Flights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedOutbound ? (
                                <div className="p-3 bg-background rounded-lg border">
                                  <p className="text-xs text-muted-foreground mb-1">Outbound</p>
                                  <p className="font-medium">{selectedOutbound.airline} {selectedOutbound.flightNumber}</p>
                                  <p className="text-sm">{selectedOutbound.fromCode} → {selectedOutbound.toCode} • {selectedOutbound.departureTime}</p>
                                  <p className="text-primary font-semibold">₹{selectedOutbound.price.toLocaleString('en-IN')}</p>
                                </div>
                              ) : (
                                <div className="p-3 bg-muted rounded-lg border border-dashed">
                                  <p className="text-sm text-muted-foreground">Select outbound flight below</p>
                                </div>
                              )}
                              {selectedReturn ? (
                                <div className="p-3 bg-background rounded-lg border">
                                  <p className="text-xs text-muted-foreground mb-1">Return</p>
                                  <p className="font-medium">{selectedReturn.airline} {selectedReturn.flightNumber}</p>
                                  <p className="text-sm">{selectedReturn.fromCode} → {selectedReturn.toCode} • {selectedReturn.departureTime}</p>
                                  <p className="text-primary font-semibold">₹{selectedReturn.price.toLocaleString('en-IN')}</p>
                                </div>
                              ) : (
                                <div className="p-3 bg-muted rounded-lg border border-dashed">
                                  <p className="text-sm text-muted-foreground">Select return flight below</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Fare</p>
                            <p className="text-2xl font-bold text-primary">₹{getTotalRoundTripPrice().toLocaleString('en-IN')}</p>
                            <Button 
                              onClick={handleBookRoundTrip}
                              disabled={!selectedOutbound || !selectedReturn}
                              className="mt-2"
                            >
                              Book Round Trip
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Outbound Flights */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                          <Plane className="w-5 h-5" />
                          Outbound: {flights[0]?.fromCode} → {flights[0]?.toCode}
                        </h2>
                        <p className="text-sm text-muted-foreground">{flights[0]?.date} • {getFilteredFlights(flights).length} flights</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select value={filterStops} onValueChange={setFilterStops}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Stops" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Flights</SelectItem>
                            <SelectItem value="nonstop">Non-stop</SelectItem>
                            <SelectItem value="1stop">1 Stop</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price">Price</SelectItem>
                            <SelectItem value="duration">Duration</SelectItem>
                            <SelectItem value="departure">Departure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {getFilteredFlights(flights).map((flight) => (
                        <div 
                          key={flight.id}
                          className={`cursor-pointer transition-all ${selectedOutbound?.id === flight.id ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => handleSelectOutbound(flight)}
                        >
                          <FlightResultCard 
                            flight={flight} 
                            onBook={(f, fareType) => handleSelectOutbound(f, fareType)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Return Flights */}
                  {returnFlights.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Plane className="w-5 h-5 rotate-180" />
                            Return: {returnFlights[0]?.fromCode} → {returnFlights[0]?.toCode}
                          </h2>
                          <p className="text-sm text-muted-foreground">{returnFlights[0]?.date} • {getFilteredFlights(returnFlights).length} flights</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {getFilteredFlights(returnFlights).map((flight) => (
                          <div 
                            key={flight.id}
                            className={`cursor-pointer transition-all ${selectedReturn?.id === flight.id ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => handleSelectReturn(flight)}
                          >
                            <FlightResultCard 
                              flight={flight} 
                              onBook={(f, fareType) => handleSelectReturn(f, fareType)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* One-way Results Header with Sort & Filter */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {getFilteredFlights(flights).length} Flights Found
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {flights[0]?.fromCode} → {flights[0]?.toCode} • {flights[0]?.date}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select value={filterStops} onValueChange={setFilterStops}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Stops" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Flights</SelectItem>
                            <SelectItem value="nonstop">Non-stop</SelectItem>
                            <SelectItem value="1stop">1 Stop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price">Price</SelectItem>
                            <SelectItem value="duration">Duration</SelectItem>
                            <SelectItem value="departure">Departure</SelectItem>
                            <SelectItem value="arrival">Arrival</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Flight Results */}
                  <div className="space-y-4">
                    {getFilteredFlights(flights).map((flight) => (
                      <FlightResultCard 
                        key={flight.id} 
                        flight={flight} 
                        onBook={handleBookFlight}
                      />
                    ))}
                  </div>

                  {getFilteredFlights(flights).length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <p>No flights match your filters. Try adjusting your criteria.</p>
                      </CardContent>
                    </Card>
                  )}
                </>
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
