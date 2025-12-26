import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Train, MapPin, Clock, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PNREnquiry() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pnr, setPnr] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    if (pnr.length !== 10) {
      toast({
        title: "Invalid PNR",
        description: "Please enter a valid 10-digit PNR number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data
    setResult({
      pnr: pnr,
      trainNumber: "12345",
      trainName: "Rajdhani Express",
      from: "New Delhi",
      to: "Mumbai Central",
      date: "2025-01-15",
      classType: "3A",
      passengers: [
        { name: "Passenger 1", status: "CNF", coach: "B2", berth: "45" },
        { name: "Passenger 2", status: "RAC", coach: "-", berth: "12" },
      ],
      chartStatus: "Chart Not Prepared",
    });
    setLoading(false);
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
          <h1 className="text-3xl font-bold mb-2">PNR Enquiry</h1>
          <p className="text-muted-foreground">Check your ticket status by entering PNR number</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter PNR Number
            </CardTitle>
            <CardDescription>
              Your 10-digit PNR number can be found on your ticket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter 10-digit PNR"
                value={pnr}
                onChange={(e) => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="text-lg tracking-wider"
                maxLength={10}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Check Status"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Train className="h-5 w-5" />
                    {result.trainName}
                  </CardTitle>
                  <CardDescription>Train No: {result.trainNumber}</CardDescription>
                </div>
                <Badge variant={result.chartStatus === "Chart Prepared" ? "default" : "secondary"}>
                  {result.chartStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-medium">{result.from}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">To</p>
                    <p className="font-medium">{result.to}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(result.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                </div>
                <Badge variant="outline">{result.classType}</Badge>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Passenger Status</span>
                </div>
                <div className="space-y-2">
                  {result.passengers.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span>{p.name}</span>
                      <div className="flex items-center gap-3">
                        <Badge variant={p.status === "CNF" ? "default" : "secondary"}>
                          {p.status}
                        </Badge>
                        {p.status === "CNF" && (
                          <span className="text-sm">{p.coach}/{p.berth}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}