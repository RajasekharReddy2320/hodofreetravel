import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Share2, Mail, MessageCircle, Check, ArrowRight, Sparkles, Edit, Scale, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DashboardNav from "@/components/DashboardNav";
import ItineraryCard from "@/components/planner/ItineraryCard";
import InteractiveRouteMap from "@/components/planner/InteractiveRouteMap";
import PlannerCart from "@/components/planner/PlannerCart";
import CustomizeItinerary from "@/components/planner/CustomizeItinerary";
import { ItineraryStep, CartItem } from "@/types/tripPlanner";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

interface GeneratedItinerary {
  id: string;
  title: string;
  subtitle: string;
  reason: string;
  estimatedTotalCost: number;
  steps: ItineraryStep[];
}

const PRIORITY_ORDER = ["Classic Explorer", "Hidden Gems", "Adventure Seeker", "Relaxed Retreat"];

const PRIORITY_COLORS: Record<string, string> = {
  "Classic Explorer": "bg-accent text-accent-foreground",
  "Hidden Gems": "bg-purple-500 text-white",
  "Adventure Seeker": "bg-orange-500 text-white",
  "Relaxed Retreat": "bg-emerald-500 text-white",
};

export default function GeneratedItineraries() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { addToCart: addToGlobalCart } = useCart();

  const [itineraries, setItineraries] = useState<GeneratedItinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<GeneratedItinerary | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<GeneratedItinerary[]>([]);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [destination, setDestination] = useState("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const state = location.state as {
      itineraries?: GeneratedItinerary[];
      currentLocation?: string;
      destination?: string;
    } | null;

    if (state?.itineraries && state.itineraries.length > 0) {
      // Sort by priority order
      const sorted = [...state.itineraries].sort((a, b) => {
        const aIndex = PRIORITY_ORDER.findIndex(p => a.title.includes(p)) ?? 99;
        const bIndex = PRIORITY_ORDER.findIndex(p => b.title.includes(p)) ?? 99;
        return aIndex - bIndex;
      });
      setItineraries(sorted);
      setCurrentLocation(state.currentLocation || "");
      setDestination(state.destination || "");
    } else {
      navigate("/ai-planner");
    }
  }, [location.state, navigate]);

  const handleSelectItinerary = (itinerary: GeneratedItinerary) => {
    if (compareMode) {
      if (compareList.find(i => i.id === itinerary.id)) {
        setCompareList(compareList.filter(i => i.id !== itinerary.id));
      } else if (compareList.length < 2) {
        setCompareList([...compareList, itinerary]);
      } else {
        toast({
          title: "Limit Reached",
          description: "You can only compare 2 itineraries at a time.",
          variant: "destructive"
        });
      }
    } else {
      setSelectedItinerary(itinerary);
      setCartItems([]);
    }
  };

  const handleAddToCart = (step: ItineraryStep) => {
    if (!cartItems.some(item => item.id === step.id)) {
      setCartItems(prev => [...prev, { ...step, addedAt: Date.now() }]);
      setIsCartOpen(true);
      toast({ title: "Added to Cart", description: step.title });
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleProceedToCheckout = () => {
    cartItems.forEach(item => {
      addToGlobalCart({
        id: item.id,
        booking_type: item.category === 'transport' ? 'flight' : 'bus',
        service_name: item.title,
        service_number: `PLN-${item.id.slice(0, 6).toUpperCase()}`,
        from_location: currentLocation || 'Origin',
        to_location: item.location,
        departure_date: new Date().toISOString().split('T')[0],
        departure_time: item.time,
        arrival_time: item.time,
        duration: item.duration || '1h',
        price_inr: item.estimatedCost || 0,
        passenger_name: '',
        passenger_email: '',
        passenger_phone: '',
      });
    });
    navigate('/cart');
  };

  const handleSaveTrip = async () => {
    if (!selectedItinerary) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { error } = await supabase
      .from("trips")
      .insert([{
        user_id: user.id,
        title: `${destination} - ${selectedItinerary.title}`,
        destination,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        trip_type: 'ai',
        itinerary: selectedItinerary as any
      }]);

    if (error) {
      toast({ title: "Error", description: "Failed to save trip", variant: "destructive" });
      return;
    }

    toast({ title: "Trip Saved!", description: "Your trip has been saved to your profile." });
  };

  const shareViaWhatsApp = () => {
    if (!selectedItinerary) return;
    const text = `Check out my ${selectedItinerary.title} trip to ${destination}! 🌍\n\nActivities:\n${selectedItinerary.steps?.slice(0, 5).map(s => `• ${s.title}`).join('\n')}\n\nEstimated Cost: ₹${(selectedItinerary.estimatedTotalCost || 0).toLocaleString('en-IN')}\n\nPlanned with Travexa`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    if (!selectedItinerary) return;
    const subject = `My Trip to ${destination} - ${selectedItinerary.title}`;
    const body = `Hi!\n\nI've planned an amazing trip using Travexa and wanted to share it with you.\n\nTrip: ${selectedItinerary.title}\nDestination: ${destination}\nEstimated Cost: ₹${(selectedItinerary.estimatedTotalCost || 0).toLocaleString('en-IN')}\n\nActivities:\n${selectedItinerary.steps?.map((s, i) => `${i + 1}. ${s.title} - ${s.location}`).join('\n')}\n\nCheers!`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const handleUpdateItinerary = (updatedSteps: ItineraryStep[]) => {
    if (!selectedItinerary) return;
    const updatedItinerary = {
      ...selectedItinerary,
      steps: updatedSteps,
      estimatedTotalCost: updatedSteps.reduce((sum, s) => sum + (s.estimatedCost || 0), 0)
    };
    setSelectedItinerary(updatedItinerary);
    setItineraries(prev => prev.map(it => it.id === updatedItinerary.id ? updatedItinerary : it));
    setCustomizeOpen(false);
    toast({ title: "Itinerary Updated", description: "Your changes have been saved." });
  };

  const getPriorityBadge = (title: string) => {
    for (const priority of PRIORITY_ORDER) {
      if (title.includes(priority)) {
        return { label: priority, color: PRIORITY_COLORS[priority] };
      }
    }
    return { label: "Custom", color: "bg-secondary text-secondary-foreground" };
  };

  // Compare View
  if (compareMode && compareList.length === 2) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Compare Itineraries</h1>
            <Button variant="outline" onClick={() => { setCompareMode(false); setCompareList([]); }}>
              <X className="mr-2 h-4 w-4" /> Exit Compare
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {compareList.map((itinerary, idx) => (
              <Card key={itinerary.id} className="border-2">
                <CardHeader>
                  <Badge className={`w-fit mb-2 ${getPriorityBadge(itinerary.title).color}`}>
                    {getPriorityBadge(itinerary.title).label}
                  </Badge>
                  <CardTitle>{itinerary.title}</CardTitle>
                  <CardDescription>{itinerary.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost</span>
                      <span className="font-bold text-primary">₹{(itinerary.estimatedTotalCost || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Activities</span>
                      <span className="font-semibold">{itinerary.steps?.length || 0}</span>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">Highlights:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {itinerary.steps?.slice(0, 5).map((step, i) => (
                          <li key={i}>• {step.title}</li>
                        ))}
                      </ul>
                    </div>
                    <Button className="w-full" onClick={() => { setCompareMode(false); setCompareList([]); setSelectedItinerary(itinerary); }}>
                      Select This Itinerary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Selected Itinerary Detail View
  if (selectedItinerary) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8 pb-32">
          <div className="max-w-5xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <Button variant="ghost" className="mb-4" onClick={() => setSelectedItinerary(null)}>
                ← Back to all options
              </Button>
              <Badge className={`mb-4 ${getPriorityBadge(selectedItinerary.title).color}`}>
                {getPriorityBadge(selectedItinerary.title).label}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{selectedItinerary.title}</h2>
              <p className="text-muted-foreground mb-4">{selectedItinerary.reason}</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-lg py-1 px-4">
                  Est. ₹{(selectedItinerary.estimatedTotalCost || 0).toLocaleString('en-IN')}
                </Badge>
                <Button onClick={handleSaveTrip} variant="secondary">Save Trip</Button>
                <Button onClick={() => setCustomizeOpen(true)} variant="outline">
                  <Edit className="mr-2 h-4 w-4" /> Customize
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Itinerary</DialogTitle>
                      <DialogDescription>Share your trip plan with friends and family</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Button onClick={shareViaWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
                        <MessageCircle className="mr-2 h-4 w-4" /> Share via WhatsApp
                      </Button>
                      <Button onClick={shareViaEmail} variant="outline" className="w-full">
                        <Mail className="mr-2 h-4 w-4" /> Share via Email
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Interactive Map */}
            {selectedItinerary.steps && selectedItinerary.steps.length > 0 && (
              <InteractiveRouteMap 
                steps={selectedItinerary.steps} 
                currentLocation={currentLocation}
                destination={destination}
              />
            )}

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-[50%] top-0 bottom-0 w-px bg-border hidden md:block -z-10 transform -translate-x-1/2"></div>
              <div className="space-y-6">
                {selectedItinerary.steps?.map((step) => (
                  <ItineraryCard
                    key={step.id}
                    step={step}
                    onAdd={handleAddToCart}
                    isAdded={cartItems.some(item => item.id === step.id)}
                  />
                ))}
              </div>
            </div>

            <div className="text-center mt-16 pb-10">
              <p className="text-muted-foreground text-sm">End of Itinerary</p>
            </div>
          </div>
        </main>

        {/* Customize Dialog */}
        <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customize Itinerary</DialogTitle>
              <DialogDescription>Modify, reorder, or remove activities</DialogDescription>
            </DialogHeader>
            <CustomizeItinerary 
              steps={selectedItinerary.steps || []} 
              onSave={handleUpdateItinerary}
              onCancel={() => setCustomizeOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <PlannerCart
          items={cartItems}
          onRemove={handleRemoveFromCart}
          isOpen={isCartOpen}
          setIsOpen={setIsCartOpen}
          currentLocation={currentLocation}
        />
      </div>
    );
  }

  // Itinerary Selection Grid
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" className="mb-2" onClick={() => navigate("/ai-planner")}>
                ← Back to Planner
              </Button>
              <h1 className="text-3xl font-bold">Your Generated Itineraries</h1>
              <p className="text-muted-foreground">Choose your adventure based on your travel style</p>
            </div>
            <Button 
              variant={compareMode ? "default" : "outline"} 
              onClick={() => { setCompareMode(!compareMode); setCompareList([]); }}
            >
              <Scale className="mr-2 h-4 w-4" /> 
              {compareMode ? "Cancel Compare" : "Compare"}
            </Button>
          </div>

          {compareMode && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Select 2 itineraries to compare. Selected: {compareList.length}/2
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {itineraries.map((itinerary, index) => {
              const priority = getPriorityBadge(itinerary.title);
              const isSelected = compareList.find(i => i.id === itinerary.id);
              
              return (
                <Card 
                  key={itinerary.id || index}
                  className={`cursor-pointer transition-all hover:shadow-xl border-2 group ${
                    isSelected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectItinerary(itinerary)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className={`mb-2 ${priority.color}`}>{priority.label}</Badge>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {itinerary.title}
                        </CardTitle>
                        <CardDescription className="mt-1">{itinerary.subtitle}</CardDescription>
                      </div>
                      {compareMode && isSelected ? (
                        <Check className="text-primary" size={20} />
                      ) : (
                        <ArrowRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{itinerary.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{itinerary.steps?.length || 0} activities</span>
                      <span className="font-bold text-primary">
                        ₹{(itinerary.estimatedTotalCost || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
