import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Search, Train, MapPin, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function TrackTrain() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trainNumber, setTrainNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<any>(null);

  const handleSearch = async () => {
    if (!trainNumber) {
      toast({
        title: "Enter Train Number",
        description: "Please enter a valid train number or PNR",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock tracking data
    setTracking({
      trainNumber: trainNumber,
      trainName: "Rajdhani Express",
      status: "Running Late",
      delay: 45,
      currentStation: "Kanpur Central",
      lastUpdated: new Date().toISOString(),
      progress: 35,
      journey: {
        from: "New Delhi",
        to: "Howrah Jn",
        departedAt: "16:55",
        expectedArrival: "10:45",
        originalArrival: "10:00",
      },
      recentStops: [
        { station: "New Delhi", status: "Departed", time: "17:10", delay: "+15 min" },
        { station: "Kanpur Central", status: "Arrived", time: "22:20", delay: "+45 min" },
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
          <h1 className="text-3xl font-bold mb-2">Track Your Train</h1>
          <p className="text-muted-foreground">Live running status and location of your train</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter Train Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Train number or PNR"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                className="text-lg"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Tracking..." : "Track Train"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {tracking && (
          <div className="space-y-4">
            {/* Status Card */}
            <Card className={tracking.delay > 0 ? "border-yellow-500/50" : "border-green-500/50"}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Train className="h-5 w-5" />
                      {tracking.trainName}
                    </CardTitle>
                    <CardDescription>Train No: {tracking.trainNumber}</CardDescription>
                  </div>
                  <Badge variant={tracking.delay > 0 ? "secondary" : "default"} className="flex items-center gap-1">
                    {tracking.delay > 0 ? (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        {tracking.delay} min late
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        On Time
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Location */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-medium">Currently at</span>
                  </div>
                  <p className="text-xl font-bold">{tracking.currentStation}</p>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(tracking.lastUpdated).toLocaleTimeString('en-IN')}
                  </p>
                </div>

                {/* Journey Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{tracking.journey.from}</span>
                    <span>{tracking.journey.to}</span>
                  </div>
                  <Progress value={tracking.progress} className="h-3" />
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    {tracking.progress}% journey completed
                  </p>
                </div>

                {/* Arrival Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Arrival</p>
                    <p className="font-medium">{tracking.journey.originalArrival}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Arrival</p>
                    <p className="font-medium text-primary">{tracking.journey.expectedArrival}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Stops */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Stops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tracking.recentStops.map((stop: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <p className="font-medium">{stop.station}</p>
                          <p className="text-sm text-muted-foreground">{stop.status} at {stop.time}</p>
                        </div>
                      </div>
                      <Badge variant={stop.delay.includes('+') ? 'secondary' : 'default'}>
                        {stop.delay}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}