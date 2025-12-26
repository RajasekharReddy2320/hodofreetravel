import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, XCircle, Train, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CancelTicket() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('booking_type', 'train')
        .eq('status', 'confirmed')
        .gte('departure_date', new Date().toISOString().split('T')[0])
        .order('departure_date', { ascending: true });

      if (data) {
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'User requested cancellation'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Ticket Cancelled",
        description: "Your refund will be processed within 5-7 business days",
      });

      setBookings(bookings.filter(b => b.id !== bookingId));
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Unable to cancel ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
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
          <h1 className="text-3xl font-bold mb-2">Cancel Ticket</h1>
          <p className="text-muted-foreground">Cancel your upcoming train bookings</p>
        </div>

        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Cancellation Policy</p>
                <p className="text-muted-foreground">Refund amount depends on how early you cancel. Cancellation charges apply as per railway rules.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">Loading...</div>
            </CardContent>
          </Card>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Train className="h-5 w-5" />
                        {booking.service_name}
                      </CardTitle>
                      <CardDescription>Train No: {booking.service_number}</CardDescription>
                    </div>
                    <Badge>{booking.class_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="font-medium">{booking.from_location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">To</p>
                      <p className="font-medium">{booking.to_location}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Journey Date</p>
                      <p className="font-medium">{new Date(booking.departure_date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Paid</p>
                      <p className="font-medium">₹{booking.price_inr?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full" disabled={cancelling === booking.id}>
                          <XCircle className="mr-2 h-4 w-4" />
                          {cancelling === booking.id ? "Cancelling..." : "Cancel This Ticket"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Ticket?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this ticket? Cancellation charges will apply and refund will be processed to your original payment method.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Ticket</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancel(booking.id)}>
                            Yes, Cancel Ticket
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Bookings</h3>
              <p className="text-muted-foreground mb-4">You don't have any upcoming train bookings to cancel</p>
              <Button onClick={() => navigate('/book-transport')}>
                Book a Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}