import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { TripParams } from '@/types/tripPlanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Wallet, MapPin, Loader2, X, Ticket, Map, Sparkles, Plus } from 'lucide-react';

interface InputFormProps {
  onSubmit: (params: TripParams) => void;
  isLoading: boolean;
  initialValues?: {
    currentLocation?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    budget?: string;
  };
  autoSubmit?: boolean;
}

export interface InputFormRef {
  submit: () => void;
}

const interestOptions = [
  'Adventure', 'Culture', 'Food', 'Nature', 'Relaxation', 
  'Shopping', 'Nightlife', 'History', 'Art', 'Sports'
];

const budgetOptions = ['Budget', 'Mid-Range', 'Luxury'];

const InputForm = forwardRef<InputFormRef, InputFormProps>(({ onSubmit, isLoading, initialValues, autoSubmit }, ref) => {
  const [currentLocation, setCurrentLocation] = useState(initialValues?.currentLocation || '');
  const [destination, setDestination] = useState(initialValues?.destination || '');
  const [additionalDestinations, setAdditionalDestinations] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(initialValues?.startDate || '');
  const [endDate, setEndDate] = useState(initialValues?.endDate || '');
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(initialValues?.budget || '');
  const [interests, setInterests] = useState<string[]>([]);
  const [planMode, setPlanMode] = useState<'tickets' | 'sightseeing' | 'full'>('full');
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  // Update state when initial values change
  useEffect(() => {
    if (initialValues?.currentLocation) setCurrentLocation(initialValues.currentLocation);
    if (initialValues?.destination) setDestination(initialValues.destination);
    if (initialValues?.startDate) setStartDate(initialValues.startDate);
    if (initialValues?.endDate) setEndDate(initialValues.endDate);
    if (initialValues?.budget) setBudget(initialValues.budget);
  }, [initialValues]);

  // Auto-submit when ready
  useEffect(() => {
    if (autoSubmit && !hasAutoSubmitted && currentLocation && destination && startDate && endDate) {
      setHasAutoSubmitted(true);
      const allDestinations = [destination, ...additionalDestinations.filter(d => d.trim())];
      onSubmit({ 
        currentLocation, 
        destination: allDestinations[0],
        destinations: allDestinations.length > 1 ? allDestinations : undefined,
        startDate, 
        endDate, 
        travelers, 
        budget: budget || undefined,
        interests: interests.length > 0 ? interests : undefined,
        planMode 
      });
    }
  }, [autoSubmit, hasAutoSubmitted, currentLocation, destination, startDate, endDate]);

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (currentLocation && destination && startDate && endDate) {
        const allDestinations = [destination, ...additionalDestinations.filter(d => d.trim())];
        onSubmit({ 
          currentLocation, 
          destination: allDestinations[0],
          destinations: allDestinations.length > 1 ? allDestinations : undefined,
          startDate, 
          endDate, 
          travelers, 
          budget: budget || undefined,
          interests: interests.length > 0 ? interests : undefined,
          planMode 
        });
      }
    }
  }));

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addDestination = () => {
    setAdditionalDestinations(prev => [...prev, '']);
  };

  const updateDestination = (index: number, value: string) => {
    setAdditionalDestinations(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const removeDestination = (index: number) => {
    setAdditionalDestinations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation || !destination || !startDate || !endDate) return;
    
    const allDestinations = [destination, ...additionalDestinations.filter(d => d.trim())];
    
    onSubmit({ 
      currentLocation, 
      destination: allDestinations[0],
      destinations: allDestinations.length > 1 ? allDestinations : undefined,
      startDate, 
      endDate, 
      travelers, 
      budget: budget || undefined,
      interests: interests.length > 0 ? interests : undefined,
      planMode 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-2xl mx-auto mb-10 shadow-lg">
      {/* Planning Mode Selection */}
      <div className="mb-8">
        <Label className="text-sm font-semibold text-foreground mb-3 block">
          What do you want to plan?
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPlanMode('tickets')}
            className={`
              relative p-4 rounded-2xl border-2 transition-all duration-300
              ${planMode === 'tickets' 
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                : 'border-border hover:border-muted-foreground/50 bg-card'
              }
            `}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-xl ${planMode === 'tickets' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Ticket className="h-6 w-6" />
              </div>
              <span className="font-semibold text-sm">Tickets Only</span>
              <span className="text-xs text-muted-foreground text-center">Budget optimized travel</span>
            </div>
            {planMode === 'tickets' && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPlanMode('sightseeing')}
            className={`
              relative p-4 rounded-2xl border-2 transition-all duration-300
              ${planMode === 'sightseeing' 
                ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20' 
                : 'border-border hover:border-muted-foreground/50 bg-card'
              }
            `}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-xl ${planMode === 'sightseeing' ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
                <Map className="h-6 w-6" />
              </div>
              <span className="font-semibold text-sm">Sightseeing</span>
              <span className="text-xs text-muted-foreground text-center">Plan activities only</span>
            </div>
            {planMode === 'sightseeing' && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                <span className="text-accent-foreground text-xs">✓</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPlanMode('full')}
            className={`
              relative p-4 rounded-2xl border-2 transition-all duration-300
              ${planMode === 'full' 
                ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20' 
                : 'border-border hover:border-muted-foreground/50 bg-card'
              }
            `}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-xl ${planMode === 'full' ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="font-semibold text-sm">Complete Trip</span>
              <span className="text-xs text-muted-foreground text-center">Tickets + Activities</span>
            </div>
            {planMode === 'full' && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        </div>
        
        {planMode === 'tickets' && (
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">💡 Smart Routing:</span> We'll find the best combination of flights, trains, and buses with optimal pricing. If direct travel isn't available, we'll show multi-leg options.
            </p>
          </div>
        )}
      </div>

      {/* Current Location */}
      <div className="mb-6">
        <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          Current Location (Departure City)
        </Label>
        <Input
          type="text"
          placeholder="e.g., Mumbai, India"
          value={currentLocation}
          onChange={(e) => setCurrentLocation(e.target.value)}
          className="bg-background rounded-xl"
          required
        />
      </div>

      {/* Destination with Multi-Destination Support */}
      <div className="mb-6">
        <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-destructive" />
          Destination
        </Label>
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="e.g., Paris, France"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="bg-background rounded-xl"
            required
          />
          
          {/* Additional Destinations */}
          {additionalDestinations.map((dest, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="text"
                placeholder={`Stop ${index + 2}: e.g., Rome, Italy`}
                value={dest}
                onChange={(e) => updateDestination(index, e.target.value)}
                className="bg-background rounded-xl flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeDestination(index)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDestination}
            className="w-full rounded-xl border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Destination
          </Button>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Start Date
          </Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-background rounded-xl"
            required
          />
        </div>
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            End Date
          </Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-background rounded-xl"
            required
          />
        </div>
      </div>

      {/* Travelers */}
      <div className="mb-6">
        <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Users size={16} className="text-primary" />
          Number of Travelers
        </Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => setTravelers(Math.max(1, travelers - 1))}
          >
            -
          </Button>
          <span className="text-xl font-bold w-10 text-center">{travelers}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => setTravelers(travelers + 1)}
          >
            +
          </Button>
        </div>
      </div>

      {/* Budget - Optional */}
      <div className="mb-6">
        <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Wallet size={16} className="text-primary" />
          Budget Level <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex gap-2">
          {budgetOptions.map((option) => (
            <Button
              key={option}
              type="button"
              variant={budget === option ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setBudget(budget === option ? '' : option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      {/* Interests - Only show for sightseeing or full mode, optional */}
      {(planMode === 'sightseeing' || planMode === 'full') && (
        <div className="mb-8">
          <Label className="text-sm font-semibold text-foreground mb-3 block">
            Interests <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => (
              <Badge
                key={interest}
                variant={interests.includes(interest) ? "default" : "outline"}
                className="cursor-pointer transition-all hover:scale-105 rounded-full px-4 py-1"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
                {interests.includes(interest) && <X size={12} className="ml-1" />}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading || !currentLocation || !destination || !startDate || !endDate}
        className="w-full py-6 text-lg font-bold rounded-2xl"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {planMode === 'tickets' ? 'Find Best Tickets' : planMode === 'sightseeing' ? 'Plan Activities' : 'Plan My Trip'}
          </>
        )}
      </Button>
    </form>
  );
});

InputForm.displayName = 'InputForm';

export default InputForm;
