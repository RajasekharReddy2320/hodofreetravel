import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, AlertCircle, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FileTDR() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pnr: "",
    reason: "",
    description: "",
    bankAccount: "",
    ifsc: "",
  });

  const reasons = [
    "Train Cancelled",
    "Train Running Late (3+ hours)",
    "AC Not Working",
    "Coach/Berth Not Provided",
    "Partial Travel",
    "Didn't Travel After Chart Preparation",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pnr || !formData.reason || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "TDR Filed Successfully",
      description: "Your TDR has been submitted. Reference: TDR" + Date.now().toString().slice(-8),
    });
    
    setLoading(false);
    navigate('/trains/refund-history');
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
          <h1 className="text-3xl font-bold mb-2">File TDR</h1>
          <p className="text-muted-foreground">Ticket Deposit Receipt for refund claims</p>
        </div>

        <Card className="mb-6 border-blue-500/50 bg-blue-500/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">When to File TDR?</p>
                <p className="text-muted-foreground">File TDR when you can't cancel normally - train delays, AC failure, coach not attached, or travel after chart preparation.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              TDR Application Form
            </CardTitle>
            <CardDescription>
              Fill in the details to file your refund claim
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pnr">PNR Number *</Label>
                <Input
                  id="pnr"
                  placeholder="Enter 10-digit PNR"
                  value={formData.pnr}
                  onChange={(e) => setFormData({ ...formData, pnr: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  maxLength={10}
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason for TDR *</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => setFormData({ ...formData, reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Bank Details for Refund (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account">Bank Account Number</Label>
                    <Input
                      id="account"
                      placeholder="Account number"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    <Input
                      id="ifsc"
                      placeholder="IFSC code"
                      value={formData.ifsc}
                      onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  If not provided, refund will be credited to original payment method
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Submitting..." : "Submit TDR"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}