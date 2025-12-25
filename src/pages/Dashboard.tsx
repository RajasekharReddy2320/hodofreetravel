import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MapPin, Calendar, Edit, Trash2, Eye, EyeOff, Plane, Clock, Wallet, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardNav from "@/components/DashboardNav";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  trip_type: string;
  planner_mode: string | null;
  budget_inr: number | null;
  is_public: boolean | null;
}

type PlannerMode = 'comfort' | 'time' | 'budget';

const PLANNER_MODES = [
  {
    value: 'comfort' as PlannerMode,
    icon: Sparkles,
    title: 'Comfort',
    description: 'Premium experiences & relaxation',
    color: 'text-purple-500'
  },
  {
    value: 'time' as PlannerMode,
    icon: Clock,
    title: 'Time Saver',
    description: 'Efficient routing & max activities',
    color: 'text-blue-500'
  },
  {
    value: 'budget' as PlannerMode,
    icon: Wallet,
    title: 'Budget',
    description: 'Cost-effective & value deals',
    color: 'text-green-500'
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<PlannerMode>('comfort');

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    await loadTrips();
    setLoading(false);
  };

  const loadTrips = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq('user_id', session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading trips:", error);
      toast({
        title: "Error",
        description: "Failed to load your trips",
        variant: "destructive"
      });
      return;
    }
    setTrips(data || []);
  };

  const deleteTrip = async (tripId: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", tripId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Success",
      description: "Trip deleted successfully"
    });
    loadTrips();
  };

  const toggleTripVisibility = async (tripId: string, isPublic: boolean) => {
    const { error } = await supabase
      .from("trips")
      .update({ is_public: !isPublic })
      .eq("id", tripId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update trip visibility",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Success",
      description: `Trip is now ${!isPublic ? "public" : "private"}`
    });
    loadTrips();
  };

  const handleStartPlanning = () => {
    navigate('/ai-planner', { state: { plannerMode: selectedMode } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-primary animate-bounce" />
          <p className="text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container px-4 py-8 max-w-5xl mx-auto">
        {/* AI Travel Planner Hero Section */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles size={14} />
            AI-Powered Planning
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Plan Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Dream Trip
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Get AI-curated itineraries tailored to your style. Pick your favorite and start booking!
          </p>

          {/* Planner Mode Selection */}
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-3 block">Choose Your Planning Style</Label>
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
              {PLANNER_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = selectedMode === mode.value;
                
                return (
                  <button
                    key={mode.value}
                    type="button"
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isActive 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                    onClick={() => setSelectedMode(mode.value)}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${isActive ? mode.color : 'text-muted-foreground'}`} />
                    <p className="font-semibold text-sm">{mode.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{mode.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Button size="lg" onClick={handleStartPlanning} className="px-8 py-6 text-lg font-bold">
            <Sparkles className="mr-2 h-5 w-5" />
            Start AI Planning
          </Button>
        </div>

        {/* Manual Plan Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Manual Trip Planning
            </CardTitle>
            <CardDescription>
              Create and manage your trips manually with full control
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/create-trip')}>
              Create New Trip
            </Button>
          </CardContent>
        </Card>

        {/* Saved Trips */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Trips</h2>
          
          {trips.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  No trips yet. Start planning your first adventure!
                </p>
                <Button onClick={() => navigate('/ai-planner')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Plan Your First Trip
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trips.map(trip => (
                <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{trip.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => toggleTripVisibility(trip.id, trip.is_public || false)} 
                          title={trip.is_public ? "Make private" : "Make public"}
                        >
                          {trip.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/trip/${trip.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteTrip(trip.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {trip.destination}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                      </div>
                      {trip.budget_inr && (
                        <div className="font-semibold text-primary">
                          ₹{trip.budget_inr.toLocaleString('en-IN')}
                        </div>
                      )}
                      {trip.planner_mode && (
                        <Badge variant="secondary" className="capitalize">
                          {trip.planner_mode} Mode
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
