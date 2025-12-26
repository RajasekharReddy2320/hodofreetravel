import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CalendarDays, Train, ArrowRightLeft, Sparkles, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FestivalRoundTrip() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    festival: "",
    passengers: "1"
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const festivals = [
    { name: "Diwali 2025", dates: "Oct 20 - Nov 5", discount: "10%" },
    { name: "Holi 2025", dates: "Mar 10 - Mar 20", discount: "5%" },
    { name: "Durga Puja 2025", dates: "Sep 25 - Oct 5", discount: "8%" },
    { name: "Christmas & New Year", dates: "Dec 20 - Jan 5", discount: "15%" },
    { name: "Summer Holidays", dates: "May 1 - Jun 15", discount: "5%" },
  ];

  const handleSearch = async () => {
    if (!formData.from || !formData.to || !formData.festival) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock results
    setResults([
      {
        id: 1,
        outbound: {
          trainName: "Rajdhani Express",
          trainNumber: "12301",
          date: "Oct 25, 2025",
          departure: "16:55",
          arrival: "08:00 +1"
        },
        return: {
          trainName: "Rajdhani Express",
          trainNumber: "12302",
          date: "Nov 2, 2025",
          departure: "17:30",
          arrival: "09:00 +1"
        },
        price: 4500,
        originalPrice: 5000,
        class: "3A"
      },
      {
        id: 2,
        outbound: {
          trainName: "Shatabdi Express",
          trainNumber: "12001",
          date: "Oct 25, 2025",
          departure: "06:00",
          arrival: "12:30"
        },
        return: {
          trainName: "Shatabdi Express",
          trainNumber: "12002",
          date: "Nov 2, 2025",
          departure: "14:00",
          arrival: "20:30"
        },
        price: 3600,
        originalPrice: 4000,
        class: "CC"
      },
    ]);
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/book-transport')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Festival Round Trip</h1>
          </div>
          <p className="text-muted-foreground">Special trains and discounts for festival seasons</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Search Festival Trains
            </CardTitle>
            <CardDescription>
              Book round trip tickets with festival discounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From</Label>
                <Input
                  placeholder="Source station"
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                />
              </div>
              <div>
                <Label>To</Label>
                <Input
                  placeholder="Destination station"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Festival Season</Label>
                <Select
                  value={formData.festival}
                  onValueChange={(value) => setFormData({ ...formData, festival: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select festival" />
                  </SelectTrigger>
                  <SelectContent>
                    {festivals.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        <div className="flex justify-between items-center w-full">
                          <span>{f.name}</span>
                          <Badge variant="secondary" className="ml-2">{f.discount} off</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Passengers</Label>
                <Select
                  value={formData.passengers}
                  onValueChange={(value) => setFormData({ ...formData, passengers: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? "Passenger" : "Passengers"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full" onClick={handleSearch} disabled={loading}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              {loading ? "Searching..." : "Search Round Trip Trains"}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available Round Trips</h2>
            {results.map((result) => (
              <Card key={result.id}>
                <CardContent className="pt-6">
                  {/* Outbound */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">Outbound</Badge>
                    <span className="text-sm text-muted-foreground">{result.outbound.date}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Train className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{result.outbound.trainName}</p>
                        <p className="text-sm text-muted-foreground">{result.outbound.trainNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{result.outbound.departure} → {result.outbound.arrival}</p>
                    </div>
                  </div>

                  {/* Return */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">Return</Badge>
                    <span className="text-sm text-muted-foreground">{result.return.date}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Train className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{result.return.trainName}</p>
                        <p className="text-sm text-muted-foreground">{result.return.trainNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{result.return.departure} → {result.return.arrival}</p>
                    </div>
                  </div>

                  {/* Price & Book */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm">Festival Special</span>
                        <Badge variant="secondary">{result.class}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground line-through">₹{result.originalPrice}</p>
                      <p className="text-xl font-bold text-primary">₹{result.price}</p>
                      <p className="text-xs text-green-500">per person</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Festival booking will be available soon!",
                      });
                    }}
                  >
                    Book Round Trip
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}