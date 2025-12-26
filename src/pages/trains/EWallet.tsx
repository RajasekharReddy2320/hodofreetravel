import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Wallet, Plus, History, CreditCard, ArrowUpRight, ArrowDownLeft, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EWallet() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState(2500);
  const [addAmount, setAddAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const transactions = [
    { id: 1, type: "credit", amount: 2000, date: "2025-01-10", description: "Added via UPI" },
    { id: 2, type: "debit", amount: 1500, date: "2025-01-08", description: "Ticket Booking - Rajdhani" },
    { id: 3, type: "credit", amount: 2000, date: "2025-01-05", description: "Added via Card" },
  ];

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleAddMoney = async () => {
    const amount = parseInt(addAmount);
    if (!amount || amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₹100",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBalance(prev => prev + amount);
    toast({
      title: "Money Added Successfully",
      description: `₹${amount.toLocaleString()} has been added to your wallet`,
    });
    
    setAddAmount("");
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
          <h1 className="text-3xl font-bold mb-2">Travel Wallet</h1>
          <p className="text-muted-foreground">Faster payments for your bookings</p>
        </div>

        {/* Balance Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-4xl font-bold">₹{balance.toLocaleString()}</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="add" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">
              <Plus className="h-4 w-4 mr-2" />
              Add Money
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Add Money to Wallet
                </CardTitle>
                <CardDescription>
                  Use wallet for faster checkout during bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex gap-2 mb-3">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setAddAmount(amount.toString())}
                      >
                        ₹{amount}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    placeholder="Enter amount (min ₹100)"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <Button className="w-full" onClick={handleAddMoney} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? "Processing..." : "Add Money"}
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secured by 256-bit encryption</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          tx.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className="h-5 w-5 text-green-500" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}