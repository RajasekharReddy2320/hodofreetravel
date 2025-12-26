import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Train, Armchair, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ChartVacancy() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trainNumber, setTrainNumber] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!trainNumber || !date) {
      toast({
        title: "Missing Information",
        description: "Please enter train number and date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data
    setResult({
      trainNumber: trainNumber,
      trainName: "Rajdhani Express",
      date: date,
      chartStatus: "Prepared",
      vacancies: [
        { class: "1A", available: 2, waitlist: 0 },
        { class: "2A", available: 8, waitlist: 3 },
        { class: "3A", available: 15, waitlist: 12 },
        { class: "SL", available: 45, waitlist: 25 },
      ],
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
          <h1 className="text-3xl font-bold mb-2">Chart Vacancy</h1>
          <p className="text-muted-foreground">Check available berths after chart preparation</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Train Availability
            </CardTitle>
            <CardDescription>
              Enter train details to check vacancy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="train">Train Number</Label>
                <Input
                  id="train"
                  placeholder="e.g., 12345"
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date">Journey Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={loading} className="w-full">
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Checking..." : "Check Vacancy"}
            </Button>
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
                <Badge className="bg-green-500">
                  Chart {result.chartStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(result.date).toLocaleDateString('en-IN', { dateStyle: 'full' })}</span>
              </div>

              <div className="space-y-3">
                {result.vacancies.map((v: any) => (
                  <div key={v.class} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Armchair className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{v.class}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-bold ${v.available > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {v.available > 0 ? `${v.available} Available` : 'Full'}
                        </p>
                        {v.waitlist > 0 && (
                          <p className="text-sm text-muted-foreground">WL/{v.waitlist}</p>
                        )}
                      </div>
                      {v.available > 0 && (
                        <Button size="sm" onClick={() => navigate('/book-transport')}>
                          Book
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}