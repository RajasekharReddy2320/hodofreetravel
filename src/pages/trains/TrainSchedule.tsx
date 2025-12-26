import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Train, MapPin, Clock, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function TrainSchedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trainNumber, setTrainNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);

  const handleSearch = async () => {
    if (!trainNumber) {
      toast({
        title: "Enter Train Number",
        description: "Please enter a valid train number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock schedule data
    setSchedule({
      trainNumber: trainNumber,
      trainName: "Rajdhani Express",
      runsDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      stops: [
        { station: "New Delhi", code: "NDLS", arrival: "-", departure: "16:55", day: 1, distance: 0 },
        { station: "Kanpur Central", code: "CNB", arrival: "21:35", departure: "21:45", day: 1, distance: 440 },
        { station: "Allahabad Jn", code: "ALD", arrival: "23:55", departure: "00:05", day: 2, distance: 640 },
        { station: "Mughal Sarai Jn", code: "MGS", arrival: "01:25", departure: "01:35", day: 2, distance: 780 },
        { station: "Gaya Jn", code: "GAYA", arrival: "03:30", departure: "03:35", day: 2, distance: 900 },
        { station: "Patna Jn", code: "PNBE", arrival: "05:25", departure: "05:35", day: 2, distance: 1000 },
        { station: "Howrah Jn", code: "HWH", arrival: "10:00", departure: "-", day: 2, distance: 1450 },
      ],
    });
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
          <h1 className="text-3xl font-bold mb-2">Train Schedule</h1>
          <p className="text-muted-foreground">View complete route and timing of any train</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Train
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter train number (e.g., 12301)"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                className="text-lg"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Get Schedule"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {schedule && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Train className="h-5 w-5" />
                    {schedule.trainName}
                  </CardTitle>
                  <CardDescription>Train No: {schedule.trainNumber}</CardDescription>
                </div>
                <div className="flex gap-1">
                  {schedule.runsDays.map((day: string) => (
                    <Badge key={day} variant="secondary" className="text-xs">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-4">
                  {schedule.stops.map((stop: any, index: number) => (
                    <div key={index} className="relative flex items-start gap-4 pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                        index === 0 || index === schedule.stops.length - 1 
                          ? 'bg-primary border-primary' 
                          : 'bg-background border-muted-foreground'
                      }`} />

                      <div className="flex-1 flex justify-between items-start p-3 bg-muted rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{stop.station}</span>
                            <Badge variant="outline" className="text-xs">{stop.code}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stop.distance} km • Day {stop.day}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {stop.arrival !== "-" ? `Arr: ${stop.arrival}` : ""}
                              {stop.arrival !== "-" && stop.departure !== "-" ? " • " : ""}
                              {stop.departure !== "-" ? `Dep: ${stop.departure}` : ""}
                            </span>
                          </div>
                        </div>
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