import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Train, Bus, Hotel, Car, Search, MapPin, Calendar, Users, Clock, TrainFront, Ticket, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { TrainServicesGrid } from "@/components/TrainServicesGrid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { differenceInHours, parseISO, format } from "date-fns";

const searchSchema = z.object({
  from: z.string().trim().min(2, "Origin must be at least 2 characters").max(100),
  to: z.string().trim().min(2, "Destination must be at least 2 characters").max(100),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  passengers: z.number().int().min(1).max(9)
});

type BookingSection = 'flights' | 'trains' | 'buses' | 'metro' | 'hotels' | 'cabs';

const SECTIONS: { id: BookingSection; label: string; icon: typeof Plane }[] = [
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'trains', label: 'Trains', icon: Train },
  { id: 'buses', label: 'Buses', icon: Bus },
  { id: 'metro', label: 'Metro', icon: TrainFront },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<BookingSection>('flights');
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [upcomingTicket, setUpcomingTicket] = useState<UpcomingBooking | null>(null);
  const [showUpcomingDialog, setShowUpcomingDialog] = useState(false);
  
  // Common form state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [rooms, setRooms] = useState("1");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  // Results
  const [flights, setFlights] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);

  // Check URL params for section and action
  useEffect(() => {
    const section = searchParams.get('section') as BookingSection;
    const action = searchParams.get('action');
    
    if (section && SECTIONS.some(s => s.id === section)) {
      setActiveSection(section);
    }
    if (action === 'search') {
      setShowSearchForm(true);
    }
  }, [searchParams]);

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
    if (activeSection === 'hotels' || activeSection === 'cabs' || activeSection === 'metro' || activeSection === 'buses') {
      toast({ title: "Coming Soon", description: `${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} booking will be available soon!` });
      return;
    }

    const validation = searchSchema.safeParse({
      from: origin,
      to: destination,
      date: departureDate,
      passengers: parseInt(passengers) || 1
    });

    if (!validation.success) {
      toast({ title: "Invalid Search", description: validation.error.issues[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const functionMap = { flights: 'search-flights', trains: 'search-trains', buses: 'search-buses' };
      const functionName = functionMap[activeSection as keyof typeof functionMap];

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { from: validation.data.from, to: validation.data.to, date: validation.data.date, passengers: validation.data.passengers }
      });

      if (error) throw error;

      if (activeSection === 'flights') setFlights(data.flights || []);
      else if (activeSection === 'trains') setTrains(data.trains || []);
      else if (activeSection === 'buses') setBuses(data.buses || []);

      toast({ title: "Search Complete", description: `Found ${data[activeSection]?.length || 0} options` });
    } catch {
      toast({ title: "Search Failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (item: any, type: string) => {
    navigate('/book-confirm', { state: { bookingType: type, booking: item } });
  };

  const renderResults = () => {
    const results = activeSection === 'flights' ? flights : activeSection === 'trains' ? trains : buses;
    
    if (results.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search to see available {activeSection}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {results.map((item: any) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{item.airline || item.name || item.operator}</h3>
                    <span className="text-sm text-muted-foreground">{item.flightNumber || item.trainNumber || item.busType}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-2xl font-bold">{item.departureTime}</p>
                      <p className="text-sm text-muted-foreground">{item.fromCode || item.from}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-px flex-1 bg-border"></div>
                      <span className="text-xs text-muted-foreground px-2">{item.duration}</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{item.arrivalTime}</p>
                      <p className="text-sm text-muted-foreground">{item.toCode || item.to}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <p className="text-3xl font-bold text-primary">₹{(item.price || (item.classes && Object.values(item.classes)[0] as any)?.price || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mb-3">{item.seatsAvailable || (item.classes as any)?.SL?.available || 'Available'} seats</p>
                  <Button onClick={() => handleBook(item, activeSection.slice(0, -1))}>Book Now</Button>
                </div>
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

  const handleSectionChange = (section: BookingSection) => {
    setActiveSection(section);
    setShowSearchForm(false);
    // Clear results when switching sections
    setFlights([]);
    setTrains([]);
    setBuses([]);
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
            <p className="text-muted-foreground">Find the best deals on flights, trains, buses, metro, hotels & cabs</p>
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
        {activeSection === 'hotels' && renderComingSoon('Hotels', '🏨')}
        {activeSection === 'cabs' && renderComingSoon('Cabs', '🚕')}

        {/* Search Form - Only for flights or trains when search is active */}
        {(activeSection === 'flights' || (activeSection === 'trains' && showSearchForm)) && (
          <Card className="mb-8 border-2 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
              <CardTitle className="flex items-center gap-2">
                {SECTIONS.find(s => s.id === activeSection)?.icon && (
                  <span className="p-2 bg-primary rounded-lg">
                    {(() => { const Icon = SECTIONS.find(s => s.id === activeSection)!.icon; return <Icon className="h-5 w-5 text-primary-foreground" />; })()}
                  </span>
                )}
                Search {SECTIONS.find(s => s.id === activeSection)?.label}
              </CardTitle>
              <CardDescription>Enter your travel details to find the best options</CardDescription>
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
        )}

        {/* Results */}
        {(activeSection === 'flights' || (activeSection === 'trains' && showSearchForm)) && renderResults()}
      </main>
    </div>
  );
}
