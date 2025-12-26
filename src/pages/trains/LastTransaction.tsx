import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Receipt, Train, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function LastTransaction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);

  useEffect(() => {
    fetchLastTransaction();
  }, []);

  const fetchLastTransaction = async () => {
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
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setTransaction(data);
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
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
          <h1 className="text-3xl font-bold mb-2">Last Transaction</h1>
          <p className="text-muted-foreground">View your most recent booking attempt or payment</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">Loading...</div>
            </CardContent>
          </Card>
        ) : transaction ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Transaction Details
                  </CardTitle>
                  <CardDescription>
                    {new Date(transaction.created_at).toLocaleString('en-IN')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(transaction.payment_status)}
                  <Badge variant={transaction.payment_status === 'completed' ? 'default' : 'destructive'}>
                    {transaction.payment_status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Train className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">{transaction.service_name}</p>
                  <p className="text-sm text-muted-foreground">Train No: {transaction.service_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{transaction.from_location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-medium">{transaction.to_location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Journey Date</p>
                  <p className="font-medium">{new Date(transaction.departure_date).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{transaction.class_type}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Amount</span>
                  </div>
                  <span className="text-xl font-bold text-primary">₹{transaction.price_inr?.toLocaleString()}</span>
                </div>
                {transaction.payment_id && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Payment ID: {transaction.payment_id}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Booking Reference</p>
                <p className="font-mono font-medium">{transaction.booking_reference}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Recent Transaction</h3>
              <p className="text-muted-foreground mb-4">You haven't made any train bookings yet</p>
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