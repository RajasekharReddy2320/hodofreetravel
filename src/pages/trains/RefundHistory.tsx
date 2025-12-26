import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCcw, CheckCircle, Clock, XCircle, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function RefundHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<any[]>([]);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
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
        .eq('status', 'cancelled')
        .order('cancelled_at', { ascending: false });

      if (data) {
        setRefunds(data);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Refunded</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
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
          <h1 className="text-3xl font-bold mb-2">Refund History</h1>
          <p className="text-muted-foreground">Track your cancelled tickets and refund status</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">Loading...</div>
            </CardContent>
          </Card>
        ) : refunds.length > 0 ? (
          <div className="space-y-4">
            {refunds.map((refund) => (
              <Card key={refund.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{refund.service_name}</CardTitle>
                      <CardDescription>Cancelled on {new Date(refund.cancelled_at).toLocaleDateString('en-IN')}</CardDescription>
                    </div>
                    {getStatusBadge(refund.payment_status === 'refunded' ? 'completed' : 'pending')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Booking Reference</span>
                    <span className="font-mono">{refund.booking_reference}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Journey</span>
                    <span>{refund.from_location} → {refund.to_location}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original Amount</span>
                    <span>₹{refund.price_inr?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Refund Amount</span>
                    <span className="text-lg font-bold text-green-500 flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {Math.floor(refund.price_inr * 0.85).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    *15% cancellation charges deducted
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Refund History</h3>
              <p className="text-muted-foreground mb-4">You don't have any cancelled tickets or pending refunds</p>
              <Button onClick={() => navigate('/my-tickets')}>
                View My Tickets
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}