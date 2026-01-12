import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plane, 
  Clock, 
  Luggage, 
  Briefcase, 
  ChevronDown, 
  ChevronUp,
  Wifi,
  Utensils,
  Armchair
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FlightSegment {
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  departureCity: string;
  arrivalCity: string;
  duration: string;
  flightNumber: string;
  aircraft: string;
  airline: string;
  airlineCode: string;
}

interface FareOption {
  type: string;
  name: string;
  price: number;
  checkinBaggage: string;
  cabinBaggage: string;
  cancellation: string;
  dateChange: string;
  seatSelection: string;
  meals: boolean;
}

interface FlightResult {
  id: string;
  airline: string;
  airlineCode: string;
  airlineLogo?: string;
  flightNumber: string;
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopDetails?: string[];
  price: number;
  seatsAvailable: number;
  date: string;
  cabin: string;
  aircraft: string;
  segments: FlightSegment[];
  fareOptions: FareOption[];
  amenities: {
    wifi: boolean;
    meals: boolean;
    entertainment: boolean;
    power: boolean;
  };
}

interface FlightResultCardProps {
  flight: FlightResult;
  onBook: (flight: FlightResult, fareType: string) => void;
}

// Airline logo mapping
const airlineLogos: Record<string, string> = {
  'AI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Air_India_Logo.svg/200px-Air_India_Logo.svg.png',
  'UK': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/Vistara_Logo.svg/200px-Vistara_Logo.svg.png',
  '6E': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/IndiGo_Airlines_logo.svg/200px-IndiGo_Airlines_logo.svg.png',
  'SG': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/51/SpiceJet_logo.svg/200px-SpiceJet_logo.svg.png',
  'G8': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/GoAir_Logo.svg/200px-GoAir_Logo.svg.png',
  'I5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/AirAsia_India_Logo.svg/200px-AirAsia_India_Logo.svg.png',
  'QP': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Akasa_Air_logo.svg/200px-Akasa_Air_logo.svg.png',
};

export function FlightResultCard({ flight, onBook }: FlightResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedFare, setSelectedFare] = useState(0);

  const getStopText = () => {
    if (flight.stops === 0) return "Non Stop";
    if (flight.stops === 1) return "1 Stop";
    return `${flight.stops} Stops`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(price);
  };

  const logoUrl = airlineLogos[flight.airlineCode] || null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50">
      <CardContent className="p-0">
        {/* Main Flight Info Row */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Airline Info */}
            <div className="flex items-center gap-3 min-w-[160px]">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={flight.airline} className="w-10 h-10 object-contain" />
                ) : (
                  <Plane className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{flight.airline}</p>
                <p className="text-xs text-muted-foreground">{flight.flightNumber}</p>
              </div>
            </div>

            {/* Time & Route */}
            <div className="flex-1 flex items-center gap-4">
              {/* Departure */}
              <div className="text-center min-w-[80px]">
                <p className="text-2xl font-bold">{flight.departureTime}</p>
                <p className="text-sm font-medium">{flight.fromCode}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[100px]">{flight.fromCity || flight.from}</p>
              </div>

              {/* Duration & Stops */}
              <div className="flex-1 flex flex-col items-center px-2">
                <p className="text-xs text-muted-foreground mb-1">{flight.duration}</p>
                <div className="w-full flex items-center gap-1">
                  <div className="h-[2px] flex-1 bg-border" />
                  {flight.stops > 0 ? (
                    <>
                      {Array.from({ length: flight.stops }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-orange-500" />
                      ))}
                    </>
                  ) : (
                    <Plane className="w-4 h-4 text-primary rotate-90" />
                  )}
                  <div className="h-[2px] flex-1 bg-border" />
                </div>
                <p className={cn(
                  "text-xs mt-1",
                  flight.stops === 0 ? "text-green-600" : "text-orange-600"
                )}>
                  {getStopText()}
                </p>
                {flight.stopDetails && flight.stopDetails.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    via {flight.stopDetails.join(", ")}
                  </p>
                )}
              </div>

              {/* Arrival */}
              <div className="text-center min-w-[80px]">
                <p className="text-2xl font-bold">{flight.arrivalTime}</p>
                <p className="text-sm font-medium">{flight.toCode}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[100px]">{flight.toCity || flight.to}</p>
              </div>
            </div>

            {/* Price & Book */}
            <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-2 min-w-[140px]">
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">₹{formatPrice(flight.price)}</p>
                <p className="text-xs text-muted-foreground">per adult</p>
              </div>
              <Button 
                onClick={() => onBook(flight, flight.fareOptions?.[selectedFare]?.type || 'ECONOMY')}
                className="min-w-[100px]"
              >
                Book Now
              </Button>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/50">
            <Badge variant="secondary" className="text-xs">
              <Briefcase className="w-3 h-3 mr-1" />
              Cabin: 7 Kg
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Luggage className="w-3 h-3 mr-1" />
              Check-in: 15 Kg
            </Badge>
            {flight.amenities?.meals && (
              <Badge variant="secondary" className="text-xs">
                <Utensils className="w-3 h-3 mr-1" />
                Meals
              </Badge>
            )}
            {flight.amenities?.wifi && (
              <Badge variant="secondary" className="text-xs">
                <Wifi className="w-3 h-3 mr-1" />
                WiFi
              </Badge>
            )}
            <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
              {flight.seatsAvailable} seats left
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              Flight Details
              {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="bg-muted/30 border-t border-border/50">
            {/* Flight Segments */}
            <div className="p-4 md:p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Flight Details
              </h4>
              
              <div className="space-y-4">
                {flight.segments?.length > 0 ? (
                  flight.segments.map((segment, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-background rounded-lg">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <Plane className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="font-bold">{segment.departureTime}</p>
                          <p className="text-sm">{segment.departureAirport}</p>
                          <p className="text-xs text-muted-foreground">{segment.departureCity}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">{segment.duration}</p>
                          <p className="text-xs text-muted-foreground">{segment.flightNumber}</p>
                          <p className="text-xs text-muted-foreground">{segment.aircraft}</p>
                        </div>
                        <div className="md:text-right">
                          <p className="font-bold">{segment.arrivalTime}</p>
                          <p className="text-sm">{segment.arrivalAirport}</p>
                          <p className="text-xs text-muted-foreground">{segment.arrivalCity}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                      <Plane className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="font-bold">{flight.departureTime}</p>
                        <p className="text-sm">{flight.fromCode}</p>
                        <p className="text-xs text-muted-foreground">{flight.fromCity || flight.from}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{flight.duration}</p>
                        <p className="text-xs text-muted-foreground">{flight.flightNumber}</p>
                        <p className="text-xs text-muted-foreground">{flight.aircraft || 'Airbus/Boeing'}</p>
                      </div>
                      <div className="md:text-right">
                        <p className="font-bold">{flight.arrivalTime}</p>
                        <p className="text-sm">{flight.toCode}</p>
                        <p className="text-xs text-muted-foreground">{flight.toCity || flight.to}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Fare Options */}
            {flight.fareOptions && flight.fareOptions.length > 0 && (
              <div className="p-4 md:p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Armchair className="w-4 h-4" />
                  Fare Options
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {flight.fareOptions.map((fare, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedFare === idx 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedFare(idx)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold">{fare.name}</span>
                        <span className="font-bold text-primary">₹{formatPrice(fare.price)}</span>
                      </div>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Cabin Baggage</span>
                          <span className="font-medium text-foreground">{fare.cabinBaggage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Check-in</span>
                          <span className="font-medium text-foreground">{fare.checkinBaggage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cancellation</span>
                          <span className={cn(
                            "font-medium",
                            fare.cancellation === "Free" ? "text-green-600" : "text-foreground"
                          )}>{fare.cancellation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date Change</span>
                          <span className="font-medium text-foreground">{fare.dateChange}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Seat Selection</span>
                          <span className="font-medium text-foreground">{fare.seatSelection}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
