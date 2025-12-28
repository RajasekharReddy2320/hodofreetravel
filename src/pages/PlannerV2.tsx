import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import InputForm, { InputFormRef } from "@/components/planner/InputForm";
import ItineraryCard from "@/components/planner/ItineraryCard";
import ItineraryMap from "@/components/planner/ItineraryMap";
import PlannerCart from "@/components/planner/PlannerCart";
import { TripParams, TripResponse, ItineraryStep, CartItem, ItineraryHistoryItem } from "@/types/tripPlanner";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Sparkles, PlusCircle, Plane, ArrowLeft, History, Share2, Trash2, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SharePostDialog } from '@/components/SharePostDialog';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

const HISTORY_KEY = 'travexa_itinerary_history';

const PlannerV2 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart: addToGlobalCart } = useCart();
  const [tripData, setTripData] = useState<TripResponse | null>(null);
  const [tripDestination, setTripDestination] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ItineraryHistoryItem[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [readAloudEnabled, setReadAloudEnabled] = useState(false);
  const { toast } = useToast();
  const inputFormRef = useRef<InputFormRef>(null);
  const { isSpeaking, speak, stop, isSupported: ttsSupported } = useTextToSpeech();

  // Parse URL params
  const urlDestination = searchParams.get('destination');
  const urlOrigin = searchParams.get('origin');
  const urlDays = searchParams.get('days');
  const urlBudget = searchParams.get('budget');
  const autoSubmit = searchParams.get('autoSubmit') === 'true';
  const shouldReadAloud = searchParams.get('readAloud') === 'true';

  // Calculate dates based on URL params
  const getInitialDates = () => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const days = urlDays ? parseInt(urlDays) : 3;
    const endDateObj = new Date(today);
    endDateObj.setDate(endDateObj.getDate() + days);
    const endDate = endDateObj.toISOString().split('T')[0];
    return { startDate, endDate };
  };

  const { startDate: initialStartDate, endDate: initialEndDate } = getInitialDates();

  // Map budget string to option
  const mapBudget = (b: string | null) => {
    if (!b) return '';
    if (b === 'low' || b.toLowerCase().includes('budget') || b.toLowerCase().includes('cheap')) return 'Budget';
    if (b === 'medium' || b.toLowerCase().includes('mid')) return 'Mid-Range';
    if (b === 'high' || b.toLowerCase().includes('luxury')) return 'Luxury';
    return '';
  };

  // Set read aloud from URL
  useEffect(() => {
    if (shouldReadAloud) {
      setReadAloudEnabled(true);
    }
  }, [shouldReadAloud]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveToHistory = (params: TripParams, response: TripResponse) => {
    const newItem: ItineraryHistoryItem = {
      id: Date.now().toString(),
      params,
      response,
      createdAt: Date.now(),
    };
    const updatedHistory = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const deleteFromHistory = (id: string) => {
    const updatedHistory = history.filter(h => h.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    toast({ title: "Deleted from history" });
  };

  const loadFromHistory = (item: ItineraryHistoryItem) => {
    setTripData(item.response);
    setTripDestination(item.params.destination);
    setCurrentLocation(item.params.currentLocation);
    setShowHistory(false);
    toast({ title: "Loaded from history", description: item.response.title });
  };

  const handleProceedToCheckout = () => {
    // Add all planner cart items to global cart
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

  const handlePlanTrip = async (params: TripParams) => {
    setIsLoading(true);
    setError(null);
    setTripData(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-trip-plan', {
        body: params
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setTripData(data);
      setTripDestination(params.destination);
      setCurrentLocation(params.currentLocation);
      
      // Auto-save to history
      saveToHistory(params, data);
      
      toast({
        title: "Trip Generated!",
        description: `Your ${params.destination} itinerary is ready.`,
      });

      // Read aloud if enabled
      if (readAloudEnabled && ttsSupported && data.steps) {
        const textToRead = `Here is your ${data.title}. ` + 
          data.steps.map((step: ItineraryStep, i: number) => 
            `Step ${i + 1}: ${step.title}. ${step.description}`
          ).join('. ');
        speak(textToRead);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate trip plan";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (step: ItineraryStep) => {
    if (!cartItems.some(item => item.id === step.id)) {
      setCartItems(prev => [...prev, { ...step, addedAt: Date.now() }]);
      setIsCartOpen(true);
      toast({
        title: "Added to Cart",
        description: step.title,
      });
    }
  };

  const handleAddAll = () => {
    if (!tripData) return;
    // Add all items that have an estimated cost
    const newItems = tripData.steps
      .filter(step => step.estimatedCost && step.estimatedCost > 0 && !cartItems.some(item => item.id === step.id))
      .map(step => ({ ...step, addedAt: Date.now() }));
    if (newItems.length > 0) {
      setCartItems(prev => [...prev, ...newItems]);
      setIsCartOpen(true);
      toast({
        title: "Added All Paid Items",
        description: `${newItems.length} items added to cart`,
      });
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const shareItinerary = async () => {
    if (!tripData) return;
    
    const shareText = `Check out my ${tripData.title} itinerary on TraveXa!\n\n${tripData.steps.map(s => `• ${s.title}`).join('\n')}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: tripData.title,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copied to clipboard!" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <Plane className="text-primary" size={24} />
              <h1 className="text-xl font-bold">Trip Planner</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ttsSupported && (
              <Button
                variant={readAloudEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (isSpeaking) stop();
                  setReadAloudEnabled(!readAloudEnabled);
                }}
              >
                {readAloudEnabled ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                {readAloudEnabled ? 'Read Aloud On' : 'Read Aloud Off'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>
      </header>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Trip History
            </DialogTitle>
            <DialogDescription>
              Your recently generated itineraries
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1" onClick={() => loadFromHistory(item)}>
                          <h4 className="font-semibold">{item.response.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.params.currentLocation} → {item.params.destination}
                            {item.params.destinations && item.params.destinations.length > 1 && 
                              ` (+${item.params.destinations.length - 1} more)`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFromHistory(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <main className="pb-20">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Intro Text */}
          {!tripData && !isLoading && (
            <div className="text-center mb-10 space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
                Where do you want to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  go?
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Enter your details below and let our AI curate a perfect, bookable itinerary just for you.
              </p>
            </div>
          )}

          {/* Input Form */}
          <InputForm 
            ref={inputFormRef}
            onSubmit={handlePlanTrip} 
            isLoading={isLoading}
            initialValues={{
              currentLocation: urlOrigin || '',
              destination: urlDestination || '',
              startDate: urlDestination ? initialStartDate : '',
              endDate: urlDestination ? initialEndDate : '',
              budget: mapBudget(urlBudget),
            }}
            autoSubmit={autoSubmit && !!urlDestination}
          />

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl flex items-center gap-3 max-w-2xl mx-auto mb-8 animate-fade-in">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {/* Results Area */}
          {tripData && (
            <div className="animate-fade-in">
              {/* Trip Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                  <Sparkles size={14} />
                  {tripData.reason}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {tripData.title}
                </h2>
                <p className="text-muted-foreground mb-6">Here is your curated itinerary</p>
                
                {/* Action Buttons */}
                <div className="flex justify-center gap-3 flex-wrap">
                  <Button
                    onClick={handleAddAll}
                    variant="secondary"
                    className="inline-flex items-center gap-2"
                  >
                    <PlusCircle size={16} />
                    Add All Paid Items to Cart
                  </Button>
                  <Button
                    onClick={shareItinerary}
                    variant="outline"
                    className="inline-flex items-center gap-2"
                  >
                    <Share2 size={16} />
                    Share Itinerary
                  </Button>
                </div>
              </div>

              {/* Interactive Map with all stops */}
              <ItineraryMap steps={tripData.steps} />

              {/* Timeline Connector Line (Visual) */}
              <div className="relative">
                <div className="absolute left-[50%] top-0 bottom-0 w-px bg-border hidden md:block -z-10 transform -translate-x-1/2"></div>
                
                {/* Steps */}
                <div className="space-y-6 relative z-10">
                  {tripData.steps.map((step) => (
                    <ItineraryCard
                      key={step.id}
                      step={step}
                      onAdd={handleAddToCart}
                      isAdded={cartItems.some(item => item.id === step.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Completion Message */}
              <div className="text-center mt-16 pb-10">
                <p className="text-muted-foreground text-sm">End of Itinerary</p>
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full mx-auto mt-2"></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Cart Component */}
      <PlannerCart
        items={cartItems}
        onRemove={handleRemoveFromCart}
        isOpen={isCartOpen}
        setIsOpen={setIsCartOpen}
        currentLocation={currentLocation}
      />
    </div>
  );
};

export default PlannerV2;
