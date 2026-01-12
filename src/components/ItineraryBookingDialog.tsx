import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Plane, Train, Bus, IndianRupee, User, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ItineraryBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itinerary: {
    destination: string;
    startDate: string;
    endDate: string;
    transportation: string;
    activities?: string[];
    estimatedBudget?: number;
  };
  postAuthor: string;
}

export const ItineraryBookingDialog = ({ 
  open, 
  onOpenChange, 
  itinerary,
  postAuthor 
}: ItineraryBookingDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [passengerDetails, setPassengerDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const getTransportIcon = (type?: string) => {
    if (!type) return <Plane className="h-5 w-5" />;
    const lowercaseType = type.toLowerCase();
    if (lowercaseType.includes("flight") || lowercaseType.includes("plane")) {
      return <Plane className="h-5 w-5" />;
    } else if (lowercaseType.includes("train")) {
      return <Train className="h-5 w-5" />;
    } else if (lowercaseType.includes("bus")) {
      return <Bus className="h-5 w-5" />;
    }
    return <Plane className="h-5 w-5" />;
  };

  const getBookingType = (type?: string): "flight" | "train" | "bus" => {
    if (!type) return "flight";
    const lowercaseType = type.toLowerCase();
    if (lowercaseType.includes("train")) return "train";
    if (lowercaseType.includes("bus")) return "bus";
    return "flight";
  };

  const handleBookNow = async () => {
    if (!passengerDetails.name || !passengerDetails.email || !passengerDetails.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all passenger details",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const estimatedPrice = itinerary.estimatedBudget || 5000;

      const { data, error } = await supabase.functions.invoke("create-booking", {
        body: {
          booking_type: getBookingType(itinerary.transportation),
          passenger_name: passengerDetails.name,
          passenger_email: passengerDetails.email,
          passenger_phone: passengerDetails.phone,
          from_location: "Your Location",
          to_location: itinerary.destination,
          departure_date: itinerary.startDate,
          departure_time: "09:00",
          arrival_date: itinerary.endDate,
          arrival_time: "18:00",
          service_name: `${postAuthor}'s Itinerary`,
          service_number: `IT-${Date.now()}`,
          price_inr: estimatedPrice,
        },
      });

      if (error) throw error;

      toast({
        title: "Booking created successfully!",
        description: "Check My Tickets to view your booking",
      });

      onOpenChange(false);
      setPassengerDetails({ name: "", email: "", phone: "" });
      navigate('/my-tickets');
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message || "Unable to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTransportIcon(itinerary.transportation)}
            Book This Itinerary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-3">Trip Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="font-medium">{itinerary.destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getTransportIcon(itinerary.transportation)}
                <div>
                  <p className="text-xs text-muted-foreground">Transportation</p>
                  <p className="font-medium">{itinerary.transportation}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Travel Dates</p>
                  <p className="font-medium">
                    {format(new Date(itinerary.startDate), "MMM dd")} - {format(new Date(itinerary.endDate), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              {itinerary.estimatedBudget && itinerary.estimatedBudget > 0 && (
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Cost</p>
                    <p className="font-medium">₹{itinerary.estimatedBudget.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}
            </div>

            {itinerary.activities && itinerary.activities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Included Activities</p>
                <div className="flex flex-wrap gap-1">
                  {itinerary.activities.map((activity, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {activity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 p-2 bg-background rounded-md">
              <p className="text-xs text-muted-foreground">
                Curated by <span className="font-medium text-foreground">{postAuthor}</span>
              </p>
            </div>
          </Card>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Passenger Details</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="passengerName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="passengerName"
                  placeholder="Enter your full name"
                  value={passengerDetails.name}
                  onChange={(e) => setPassengerDetails({ ...passengerDetails, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="passengerEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="passengerEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={passengerDetails.email}
                  onChange={(e) => setPassengerDetails({ ...passengerDetails, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="passengerPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="passengerPhone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={passengerDetails.phone}
                  onChange={(e) => setPassengerDetails({ ...passengerDetails, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={handleBookNow} disabled={isLoading}>
            {isLoading ? "Booking..." : "Book Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
