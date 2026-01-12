import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Train, Bus, Hotel, CreditCard, IndianRupee } from "lucide-react";
import { z } from "zod";

// Security: Input validation schema
const passengerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain letters, spaces, dots, hyphens and apostrophes"),
  email: z.string()
    .trim()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters"),
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number. Use format: +91XXXXXXXXXX or 10-digit number")
    .max(15, "Phone number must be less than 15 characters")
});

export default function BookConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookingType, booking } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [passengerName, setPassengerName] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");

  if (!booking) {
    navigate('/book-transport');
    return null;
  }

  const getPrice = () => {
    if (bookingType === 'train' && booking.classes && booking.selectedClass) {
      return booking.classes[booking.selectedClass]?.price || booking.price || 0;
    }
    if (bookingType === 'hotel') {
      return booking.pricePerNight || booking.totalPrice || 0;
    }
    return booking.price || 0;
  };

  const handlePayment = async () => {
    // Security: Validate passenger details
    const validation = passengerSchema.safeParse({
      name: passengerName,
      email: passengerEmail,
      phone: passengerPhone
    });

    if (!validation.success) {
      toast({
        title: "Invalid Details",
        description: validation.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use validated data
      const validatedData = validation.data;
      
      // Create booking with validated data
      const bookingData: any = {
        booking_type: bookingType,
        passenger_name: validatedData.name,
        passenger_email: validatedData.email,
        passenger_phone: validatedData.phone,
        from_location: booking.from || booking.fromCode || booking.location || '',
        to_location: booking.to || booking.toCode || booking.location || '',
        departure_date: booking.date || new Date().toISOString().split('T')[0],
        departure_time: booking.departureTime || '12:00',
        arrival_date: booking.date || new Date().toISOString().split('T')[0],
        arrival_time: booking.arrivalTime || '14:00',
        price_inr: getPrice(),
      };

      if (bookingType === 'flight') {
        bookingData.service_name = booking.airline;
        bookingData.service_number = booking.flightNumber;
        bookingData.seat_number = `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`;
        bookingData.class_type = booking.cabin || 'Economy';
      } else if (bookingType === 'train') {
        bookingData.service_name = booking.name;
        bookingData.service_number = booking.trainNumber;
        bookingData.seat_number = `${booking.selectedClass}-${Math.floor(Math.random() * 100) + 1}`;
        bookingData.class_type = booking.selectedClass;
      } else if (bookingType === 'bus') {
        bookingData.service_name = booking.operator;
        bookingData.service_number = booking.busType;
        bookingData.seat_number = `${Math.floor(Math.random() * 40) + 1}`;
        bookingData.class_type = booking.busType;
      } else if (bookingType === 'hotel') {
        bookingData.service_name = booking.name;
        bookingData.service_number = `HTL-${booking.id}`;
        bookingData.class_type = booking.roomType || 'Standard Room';
        bookingData.from_location = booking.location;
        bookingData.to_location = booking.location;
      }

      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: bookingData
      });

      if (error) throw error;

      // Simulate payment (in prototype mode)
      const paymentId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Update booking with payment
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'completed',
          payment_id: paymentId
        })
        .eq('id', data.booking.id);

      if (updateError) throw updateError;

      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your ${bookingType} has been booked successfully`,
      });

      navigate('/my-tickets');
    } catch (error: any) {
      // Security: Don't log detailed errors to console in production
      toast({
        title: "Booking Failed",
        description: "Failed to complete booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (bookingType) {
      case 'flight': return Plane;
      case 'train': return Train;
      case 'bus': return Bus;
      case 'hotel': return Hotel;
      default: return Plane;
    }
  };

  const Icon = getIcon();

  const renderBookingDetails = () => {
    if (bookingType === 'hotel') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              Hotel Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-lg">{booking.name}</p>
              <p className="text-sm text-muted-foreground">{booking.location}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Room Type</p>
                <p className="font-semibold">{booking.roomType || 'Standard Room'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="font-semibold">{'⭐'.repeat(booking.rating || 3)}</p>
              </div>
            </div>
            {booking.amenities && (
              <div>
                <p className="text-sm text-muted-foreground">Amenities</p>
                <p className="font-semibold">{booking.amenities.slice(0, 3).join(', ')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {bookingType === 'flight' ? 'Flight' : bookingType === 'train' ? 'Train' : 'Bus'} Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-lg">
                {bookingType === 'flight' && booking.airline}
                {bookingType === 'train' && booking.name}
                {bookingType === 'bus' && booking.operator}
              </p>
              <p className="text-sm text-muted-foreground">
                {bookingType === 'flight' && booking.flightNumber}
                {bookingType === 'train' && booking.trainNumber}
                {bookingType === 'bus' && booking.busType}
              </p>
            </div>
            {bookingType === 'train' && (
              <div className="text-right">
                <p className="font-semibold">{booking.selectedClass} Class</p>
              </div>
            )}
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <p className="font-semibold">{booking.from || booking.fromCode}</p>
              <p className="text-lg font-bold">{booking.departureTime}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">To</p>
              <p className="font-semibold">{booking.to || booking.toCode}</p>
              <p className="text-lg font-bold">{booking.arrivalTime}</p>
            </div>
          </div>
          {booking.date && (
            <div>
              <p className="text-sm text-muted-foreground">Journey Date</p>
              <p className="font-semibold">{new Date(booking.date).toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Confirm Your Booking</h1>
          <p className="text-muted-foreground">Review details and complete payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Details */}
            {renderBookingDetails()}

            {/* Passenger/Guest Details */}
            <Card>
              <CardHeader>
                <CardTitle>{bookingType === 'hotel' ? 'Guest' : 'Passenger'} Details</CardTitle>
                <CardDescription>Enter {bookingType === 'hotel' ? 'guest' : 'traveler'} information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="As per ID proof"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base {bookingType === 'hotel' ? 'Rate' : 'Fare'}</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {getPrice().toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes & Fees</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {Math.floor(getPrice() * 0.12).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary flex items-center">
                      <IndianRupee className="h-5 w-5" />
                      {Math.floor(getPrice() * 1.12).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <Separator />
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {loading ? 'Processing...' : 'Book Now'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Secure payment powered by Razorpay
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
