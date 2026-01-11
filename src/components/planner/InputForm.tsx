import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { TripParams } from '@/types/tripPlanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Wallet, MapPin, Loader2, Plus, LocateFixed, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
const travelWithOptions = ['Family', 'Friends', 'Business', 'Solo'];

const InputForm = forwardRef<InputFormRef, InputFormProps>(({ onSubmit, isLoading, initialValues, autoSubmit }, ref) => {
  const [currentLocation, setCurrentLocation] = useState(initialValues?.currentLocation || '');
  const [destination, setDestination] = useState(initialValues?.destination || '');
  const [startDate, setStartDate] = useState(initialValues?.startDate || '');
  const [endDate, setEndDate] = useState(initialValues?.endDate || '');
  const [startTime, setStartTime] = useState('09:00');
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(initialValues?.budget || '');
  const [interests, setInterests] = useState<string[]>([]);
  const [travelWith, setTravelWith] = useState('');
  const [description, setDescription] = useState('');
  const [tripType, setTripType] = useState<'tour' | 'commute'>('tour');
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { toast } = useToast();

  // Auto-detect location on mount if no initial location
  useEffect(() => {
    if (!initialValues?.currentLocation && !currentLocation && navigator.geolocation) {
      detectLocation();
    }
  }, []);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }

    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await response.json();
          
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
          const state = data.address?.state;
          const country = data.address?.country;
          
          const locationName = [city, state, country].filter(Boolean).join(', ');
          
          if (locationName) {
            setCurrentLocation(locationName);
            toast({ title: "Location detected", description: locationName });
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast({ 
            title: "Location access denied", 
            description: "Please enter your location manually",
            variant: "destructive" 
          });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
    if (autoSubmit && !hasAutoSubmitted && currentLocation && destination && startDate) {
      const isValid = tripType === 'tour' ? !!endDate : true;
      if (isValid) {
        setHasAutoSubmitted(true);
        handleFormSubmit();
      }
    }
  }, [autoSubmit, hasAutoSubmitted, currentLocation, destination, startDate, endDate, tripType]);

  useImperativeHandle(ref, () => ({
    submit: handleFormSubmit
  }));

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleFormSubmit = () => {
    if (!currentLocation || !destination || !startDate) return;
    if (tripType === 'tour' && !endDate) return;
    
    onSubmit({ 
      currentLocation, 
      destination,
      startDate, 
      endDate: tripType === 'commute' ? startDate : endDate,
      travelers, 
      budget: budget || undefined,
      interests: interests.length > 0 ? interests : undefined,
      planMode: tripType === 'commute' ? 'tickets' : 'full'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-10">
      {/* Trip Type Toggle */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => setTripType('tour')}
          className={`
            px-8 py-3 rounded-full font-semibold transition-all duration-300 text-sm
            ${tripType === 'tour' 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
              : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
            }
          `}
        >
          Tour
        </button>
        <button
          type="button"
          onClick={() => setTripType('commute')}
          className={`
            px-8 py-3 rounded-full font-semibold transition-all duration-300 text-sm
            ${tripType === 'commute' 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
              : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
            }
          `}
        >
          Commute
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg">
        {tripType === 'tour' ? (
          /* Tour Form */
          <div className="space-y-6">
            {/* Row 1: Departure & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Departure*</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={isDetectingLocation ? "Detecting..." : "Enter departure city"}
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="bg-background border-border rounded-xl flex-1"
                    required
                    disabled={isDetectingLocation}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                    className="shrink-0 rounded-xl border-border"
                    title="Detect my location"
                  >
                    {isDetectingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Destination</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="bg-background border-border rounded-xl flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-xl border-border"
                    title="Add destination"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Row 2: Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Start Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">End Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 3: Travelers & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">No. Of Travellers</Label>
                <Input
                  type="number"
                  min={1}
                  value={travelers}
                  onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                  className="bg-background border-border rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Budget</Label>
                <Input
                  type="text"
                  placeholder="e.g., ₹50,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="bg-background border-border rounded-xl"
                />
              </div>
            </div>

            {/* Row 4: Travel With & Interests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Family/Friends/Business</Label>
                <Select value={travelWith} onValueChange={setTravelWith}>
                  <SelectTrigger className="bg-background border-border rounded-xl">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {travelWithOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Interests</Label>
                <Select 
                  value={interests.length > 0 ? interests[0] : ''} 
                  onValueChange={(val) => {
                    if (!interests.includes(val)) {
                      setInterests([...interests, val]);
                    }
                  }}
                >
                  <SelectTrigger className="bg-background border-border rounded-xl">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {interestOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Interests Tags */}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="cursor-pointer rounded-full px-3 py-1"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest} ×
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Description</Label>
              <Textarea
                placeholder="Add any special requests or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border rounded-xl min-h-[100px] resize-none"
              />
            </div>
          </div>
        ) : (
          /* Commute Form */
          <div className="space-y-6">
            {/* Row 1: Departure & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Departure*</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={isDetectingLocation ? "Detecting..." : "Enter departure city"}
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="bg-background border-border rounded-xl flex-1"
                    required
                    disabled={isDetectingLocation}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                    className="shrink-0 rounded-xl border-border"
                    title="Detect my location"
                  >
                    {isDetectingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Destination*</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="bg-background border-border rounded-xl flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-xl border-border"
                    title="Add destination"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Row 2: Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Start Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Start Time</Label>
                <div className="relative">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-background border-border rounded-xl"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center mt-8">
        <Button
          type="submit"
          disabled={isLoading || !currentLocation || !destination || !startDate || (tripType === 'tour' && !endDate)}
          className="px-12 py-6 text-base font-semibold rounded-full bg-white text-black hover:bg-gray-100 shadow-lg"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            tripType === 'tour' ? 'Generate Itinerary' : 'Generate Route'
          )}
        </Button>
      </div>
    </form>
  );
});

InputForm.displayName = 'InputForm';

export default InputForm;
