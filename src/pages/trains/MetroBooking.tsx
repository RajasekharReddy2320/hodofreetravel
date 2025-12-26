import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Train, MapPin, QrCode, Users, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MetroBooking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    city: "",
    from: "",
    to: "",
    passengers: "1"
  });
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);

  const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad"];
  
  const stations: Record<string, string[]> = {
    Delhi: ["Rajiv Chowk", "Kashmere Gate", "Central Secretariat", "Hauz Khas", "Chandni Chowk", "AIIMS", "INA", "Nehru Place"],
    Mumbai: ["CSMT", "Dadar", "Andheri", "Ghatkopar", "Thane", "Versova"],
    Bangalore: ["MG Road", "Indiranagar", "Whitefield", "Majestic", "Yelahanka"],
    Chennai: ["Chennai Central", "Egmore", "Guindy", "Airport", "Koyambedu"],
    Kolkata: ["Howrah", "Esplanade", "Salt Lake", "Dum Dum", "Park Street"],
    Hyderabad: ["Hitech City", "Ameerpet", "MGBS", "LB Nagar", "Nagole"]
  };

  const handleBooking = async () => {
    if (!formData.city || !formData.from || !formData.to) {
      toast({
        title: "Missing Information",
        description: "Please select city, source and destination stations",
        variant: "destructive",
      });
      return;
    }

    if (formData.from === formData.to) {
      toast({
        title: "Invalid Selection",
        description: "Source and destination cannot be the same",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const fare = Math.floor(Math.random() * 30) + 20;
    setTicket({
      id: "MTR" + Date.now().toString().slice(-8),
      city: formData.city,
      from: formData.from,
      to: formData.to,
      passengers: parseInt(formData.passengers),
      fare: fare * parseInt(formData.passengers),
      validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      qrCode: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="55" font-size="10" fill="white" text-anchor="middle">QR</text></svg>`
    });
    
    toast({
      title: "Metro Ticket Booked!",
      description: "Your QR ticket is ready",
    });
    
    setLoading(false);
  };

  const resetForm = () => {
    setTicket(null);
    setFormData({ city: "", from: "", to: "", passengers: "1" });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/book-transport')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Metro Booking</h1>
          <p className="text-muted-foreground">Book QR-code based metro tickets</p>
        </div>

        {!ticket ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Train className="h-5 w-5" />
                Book Metro Ticket
              </CardTitle>
              <CardDescription>
                Get instant QR tickets for metro travel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select City</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value, from: "", to: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city} Metro
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.city && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>From Station</Label>
                      <Select
                        value={formData.from}
                        onValueChange={(value) => setFormData({ ...formData, from: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {stations[formData.city]?.map((station) => (
                            <SelectItem key={station} value={station}>
                              {station}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>To Station</Label>
                      <Select
                        value={formData.to}
                        onValueChange={(value) => setFormData({ ...formData, to: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {stations[formData.city]?.map((station) => (
                            <SelectItem key={station} value={station}>
                              {station}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Number of Passengers</Label>
                    <Select
                      value={formData.passengers}
                      onValueChange={(value) => setFormData({ ...formData, passengers: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? "Passenger" : "Passengers"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button 
                className="w-full" 
                onClick={handleBooking} 
                disabled={loading || !formData.city}
              >
                <QrCode className="mr-2 h-4 w-4" />
                {loading ? "Generating Ticket..." : "Get QR Ticket"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <Badge className="w-fit mx-auto mb-2">QR Ticket</Badge>
              <CardTitle>{ticket.city} Metro</CardTitle>
              <CardDescription>Ticket ID: {ticket.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Placeholder */}
              <div className="flex justify-center">
                <div className="h-48 w-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Scan this QR code at the metro gate
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-medium">{ticket.from}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">To</p>
                    <p className="font-medium">{ticket.to}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{ticket.passengers} Passenger(s)</span>
                </div>
                <span className="text-xl font-bold text-primary">₹{ticket.fare}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Clock className="h-4 w-4" />
                <span>Valid until: {new Date(ticket.validUntil).toLocaleString('en-IN')}</span>
              </div>

              <Button variant="outline" className="w-full" onClick={resetForm}>
                Book Another Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}