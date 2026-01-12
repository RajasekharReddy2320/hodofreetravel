import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Train, Bus, Hotel, Car, Search, MapPin, Calendar, Users, TrainFront, Ticket, AlertCircle, Star, Wifi, Coffee, IndianRupee } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { TrainServicesGrid } from "@/components/TrainServicesGrid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { differenceInHours, parseISO, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const searchSchema = z.object({
  from: z.string().trim().min(2, "Origin must be at least 2 characters").max(100),
  to: z.string().trim().min(2, "Destination must be at least 2 characters").max(100),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  passengers: z.number().int().min(1).max(9)
});

const hotelSearchSchema = z.object({
  city: z.string().trim().min(2, "City must be at least 2 characters").max(100),
  checkInDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid check-in date"),
  checkOutDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid check-out date"),
  guests: z.number().int().min(1).max(9),
  rooms: z.number().int().min(1).max(5),
});

type BookingSection = 'flights' | 'hotels' | 'trains' | 'buses' | 'metro' | 'cabs';

// Reordered: Flights, Hotels, Trains, then others
const SECTIONS: { id: BookingSection; label: string; icon: typeof Plane }[] = [
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
  { id: 'trains', label: 'Trains', icon: Train },
  { id: 'buses', label: 'Buses', icon: Bus },
  { id: 'metro', label: 'Metro', icon: TrainFront },
  { id: 'cabs', label: 'Cabs', icon: Car },
];

interface UpcomingBooking {
  id: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  service_name: string;
  booking_type: string;
  booking_reference: string;
}

export default function BookingHub() {
  const navigate = useNavigate();
  const { section: urlSection } = useParams<{ section?: string }>();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<BookingSection>('flights');
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [upcomingTicket, setUpcomingTicket] = useState<UpcomingBooking | null>(null);
  const [showUpcomingDialog, setShowUpcomingDialog] = useState(false);
  
  // Flight/Train form state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [passengers, setPassengers] = useState("1");

  // Hotel form state
  const [hotelCity, setHotelCity] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState("2");
  const [rooms, setRooms] = useState("1");

  // Results
  const [flights, setFlights] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);

  // Sync section from URL
  useEffect(() => {
    if (urlSection && SECTIONS.some(s => s.id === urlSection)) {
      setActiveSection(urlSection as BookingSection);
    }
  }, [urlSection]);

  // Update URL when section changes
  const handleSectionChange = (section: BookingSection) => {
    setActiveSection(section);
    setShowSearchForm(false);
    navigate(`/book-transport/${section}`, { replace: true });
    // Clear results when switching sections
    setFlights([]);
    setTrains([]);
    setHotels([]);
  };

  // Check for upcoming journeys within 4 hours on page load
  useEffect(() => {
    checkUpcomingJourney();
  }, []);

  const checkUpcomingJourney = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const now = new Date();
    
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "confirmed")
      .gte("departure_date", format(now, "yyyy-MM-dd"))
      .order("departure_date", { ascending: true })
      .order("departure_time", { ascending: true });

    if (bookings && bookings.length > 0) {
      for (const booking of bookings) {
        const departureDateTime = parseISO(`${booking.departure_date}T${booking.departure_time}`);
        const hoursUntilDeparture = differenceInHours(departureDateTime, now);
        
        if (hoursUntilDeparture >= 0 && hoursUntilDeparture <= 4) {
          setUpcomingTicket(booking);
          setShowUpcomingDialog(true);
          break;
        }
      }
    }
  };

  const handleSearch = async () => {
    // Coming soon sections
    if (activeSection === 'cabs' || activeSection === 'metro' || activeSection === 'buses') {
      toast({ title: "Coming Soon", description: `${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} booking will be available soon!` });
      return;
    }

    setLoading(true);
    try {
      if (activeSection === 'flights') {
        const validation = searchSchema.safeParse({
          from: origin,
          to: destination,
          date: departureDate,
          passengers: parseInt(passengers) || 1
        });

        if (!validation.success) {
          toast({ title: "Invalid Search", description: validation.error.issues[0].message, variant: "destructive" });
          setLoading(false);
          return;
        }

        // Use Amadeus API for real-time flights
        const { data, error } = await supabase.functions.invoke('search-flights-amadeus', {
          body: { from: validation.data.from, to: validation.data.to, date: validation.data.date, passengers: validation.data.passengers }
        });

        if (error) throw error;
        setFlights(data.flights || []);
        toast({ title: "Search Complete", description: `Found ${data.flights?.length || 0} flights` });

      } else if (activeSection === 'hotels') {
        const validation = hotelSearchSchema.safeParse({
          city: hotelCity,
          checkInDate,
          checkOutDate,
          guests: parseInt(guests) || 2,
          rooms: parseInt(rooms) || 1
        });

        if (!validation.success) {
          toast({ title: "Invalid Search", description: validation.error.issues[0].message, variant: "destructive" });
          setLoading(false);
          return;
        }

        // Use Amadeus API for real-time hotels
        const { data, error } = await supabase.functions.invoke('search-hotels-amadeus', {
          body: validation.data
        });

        if (error) throw error;
        setHotels(data.hotels || []);
        toast({ title: "Search Complete", description: `Found ${data.hotels?.length || 0} hotels` });

      } else if (activeSection === 'trains') {
        const validation = searchSchema.safeParse({
          from: origin,
          to: destination,
          date: departureDate,
          passengers: parseInt(passengers) || 1
        });

        if (!validation.success) {
          toast({ title: "Invalid Search", description: validation.error.issues[0].message, variant: "destructive" });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('search-trains', {
          body: { from: validation.data.from, to: validation.data.to, date: validation.data.date }
        });

        if (error) throw error;
        setTrains(data.trains || []);
        toast({ title: "Search Complete", description: `Found ${data.trains?.length || 0} trains` });
      }
    } catch (error: any) {
      toast({ title: "Search Failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBookFlight = (item: any) => {
    navigate('/book-confirm', { state: { bookingType: 'flight', booking: item } });
  };

  const handleBookTrain = (train: any, classType: string) => {
    navigate('/book-confirm', { state: { bookingType: 'train', booking: { ...train, selectedClass: classType } } });
  };

  const handleBookHotel = (hotel: any) => {
    navigate('/book-confirm', { state: { bookingType: 'hotel', booking: hotel } });
  };

  const renderFlightResults = () => {
    if (flights.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search to see available flights</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {flights.map((flight: any) => (
          <Card key={flight.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{flight.airline}</h3>
                    <span className="text-sm text-muted-foreground">{flight.flightNumber}</span>
                    <Badge variant="secondary" className="text-xs">{flight.cabin || 'Economy'}</Badge>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-2xl font-bold">{flight.departureTime}</p>
                      <p className="text-sm text-muted-foreground">{flight.fromCode}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-px flex-1 bg-border"></div>
                      <div className="text-center px-3">
                        <span className="text-xs text-muted-foreground">{flight.duration}</span>
                        <p className="text-xs text-muted-foreground">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop(s)`}</p>
                      </div>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{flight.arrivalTime}</p>
                      <p className="text-sm text-muted-foreground">{flight.toCode}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <p className="text-3xl font-bold text-primary flex items-center justify-end">
                    <IndianRupee className="h-6 w-6" />
                    {flight.price.toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">{flight.seatsAvailable} seats left</p>
                  <Button onClick={() => handleBookFlight(flight)}>Book Now</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderHotelResults = () => {
    if (hotels.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search to see available hotels</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel: any) => (
          <Card key={hotel.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Hotel className="h-16 w-16 text-primary/50" />
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg line-clamp-1">{hotel.name}</h3>
                <div className="flex items-center gap-1">
                  {Array.from({ length: hotel.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {hotel.location}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {hotel.amenities?.slice(0, 3).map((amenity: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {hotel.pricePerNight.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">per night</p>
                </div>
                <Button onClick={() => handleBookHotel(hotel)}>Book Now</Button>
              </div>

              {hotel.freeCancellation && (
                <p className="text-xs text-green-600 mt-2">✓ Free cancellation</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderTrainResults = () => {
    if (trains.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search to see available trains</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {trains.map((train: any) => (
          <Card key={train.id} className="hover:shadow-lg transition-shadow">
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
                {Object.entries(train.classes || {}).map(([className, classData]: [string, any]) => (
                  <Card key={className} className="border-2">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="font-semibold">{className}</p>
                        <p className="text-2xl font-bold text-primary my-2 flex items-center justify-center">
                          <IndianRupee className="h-4 w-4" />
                          {classData.price.toLocaleString('en-IN')}
                        </p>
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
        ))}
      </div>
    );
  };

  const renderComingSoon = (type: string, emoji: string) => (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h3 className="text-xl font-semibold mb-2">{type} Booking Coming Soon!</h3>
        <p className="text-muted-foreground">We're working on bringing you the best {type.toLowerCase()} options. Stay tuned!</p>
      </CardContent>
    </Card>
  );

  const renderSearchForm = () => {
    if (activeSection === 'hotels') {
      return (
        <Card className="mb-8 border-2 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <span className="p-2 bg-primary rounded-lg">
                <Hotel className="h-5 w-5 text-primary-foreground" />
              </span>
              Search Hotels
            </CardTitle>
            <CardDescription>Find the best hotels with real-time availability</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2 mb-2"><MapPin size={14} /> City</Label>
                <Input placeholder="e.g., Bangalore" value={hotelCity} onChange={(e) => setHotelCity(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2"><Calendar size={14} /> Check-in</Label>
                <Input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2"><Calendar size={14} /> Check-out</Label>
                <Input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2"><Users size={14} /> Guests</Label>
                <Input type="number" min="1" max="9" value={guests} onChange={(e) => setGuests(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={loading} className="w-full">
                  <Search className="mr-2 h-4 w-4" /> {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Flights and Trains form
    return (
      <Card className="mb-8 border-2 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center gap-2">
            {activeSection === 'flights' ? (
              <span className="p-2 bg-primary rounded-lg">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </span>
            ) : (
              <span className="p-2 bg-primary rounded-lg">
                <Train className="h-5 w-5 text-primary-foreground" />
              </span>
            )}
            Search {activeSection === 'flights' ? 'Flights' : 'Trains'}
          </CardTitle>
          <CardDescription>
            {activeSection === 'flights' 
              ? 'Search real-time flight availability powered by Amadeus' 
              : 'Enter your travel details to find the best options'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2"><MapPin size={14} /> Origin</Label>
              <Input placeholder="From city" value={origin} onChange={(e) => setOrigin(e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2"><MapPin size={14} /> Destination</Label>
              <Input placeholder="To city" value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2"><Calendar size={14} /> Departure Date</Label>
              <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2"><Users size={14} /> Passengers</Label>
              <Input type="number" min="1" max="9" value={passengers} onChange={(e) => setPassengers(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                <Search className="mr-2 h-4 w-4" /> {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      {/* Upcoming Journey Dialog */}
      <Dialog open={showUpcomingDialog} onOpenChange={setShowUpcomingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Upcoming Journey Alert!
            </DialogTitle>
            <DialogDescription>
              Your journey is starting soon. Here's your ticket.
            </DialogDescription>
          </DialogHeader>
          {upcomingTicket && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground capitalize">{upcomingTicket.booking_type}</span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Departing Soon</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{upcomingTicket.from_location}</p>
                      <p className="text-sm text-muted-foreground">{upcomingTicket.departure_time}</p>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="h-px flex-1 bg-border"></div>
                      <Ticket className="h-4 w-4 mx-2 text-primary" />
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{upcomingTicket.to_location}</p>
                      <p className="text-sm text-muted-foreground">{upcomingTicket.departure_date}</p>
                    </div>
                  </div>
                  <p className="text-sm mt-3 text-muted-foreground">{upcomingTicket.service_name}</p>
                </CardContent>
              </Card>
              <Button 
                className="w-full" 
                onClick={() => {
                  setShowUpcomingDialog(false);
                  navigate('/ticket-details', { state: { booking: upcomingTicket } });
                }}
              >
                View Full Ticket
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Section Nav */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Book Your Journey</h1>
            <p className="text-muted-foreground">Find the best deals on flights, hotels, trains & more</p>
          </div>
          
          {/* Section Navigation - Top Right */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleSectionChange(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeSection === id 
                    ? 'bg-background shadow-md text-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Train Services Grid for Trains tab */}
        {activeSection === 'trains' && !showSearchForm && <TrainServicesGrid />}

        {/* Coming Soon sections */}
        {activeSection === 'metro' && renderComingSoon('Metro', '🚇')}
        {activeSection === 'buses' && renderComingSoon('Buses', '🚌')}
        {activeSection === 'cabs' && renderComingSoon('Cabs', '🚕')}

        {/* Search Form - For flights, hotels, or trains when search is active */}
        {(activeSection === 'flights' || activeSection === 'hotels' || (activeSection === 'trains' && showSearchForm)) && renderSearchForm()}

        {/* Results */}
        {activeSection === 'flights' && renderFlightResults()}
        {activeSection === 'hotels' && renderHotelResults()}
        {(activeSection === 'trains' && showSearchForm) && renderTrainResults()}
      </main>
    </div>
  );
}
