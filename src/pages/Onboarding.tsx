import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

const INTERESTS = [
  'Beach', 'Mountains', 'City', 'Adventure', 'Culture', 'Food', 
  'Wildlife', 'Luxury', 'Budget Travel', 'History', 'Nature', 'Shopping'
];

const BUDGET_RANGES = [
  { value: 'budget', label: '$ Budget Friendly', desc: 'Under $1000/trip' },
  { value: 'moderate', label: '$$ Moderate', desc: '$1000-$3000/trip' },
  { value: 'luxury', label: '$$$ Luxury', desc: '$3000+/trip' },
  { value: 'flexible', label: 'Flexible', desc: 'No specific budget' },
];

const Onboarding = () => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setUserId(session.user.id);
        // Check if already onboarded
        checkOnboardingStatus(session.user.id);
      }
    });
  }, [navigate]);

  const checkOnboardingStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (data?.onboarding_completed) {
      navigate('/');
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = async () => {
    if (selectedInterests.length === 0) {
      toast({
        title: 'Please select interests',
        description: 'Choose at least one interest to continue',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedBudget) {
      toast({
        title: 'Please select budget',
        description: 'Choose a budget range to continue',
        variant: 'destructive',
      });
      return;
    }

    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          interests: selectedInterests,
          budget_range: selectedBudget,
          onboarding_completed: true,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Welcome to TraviLink!',
        description: 'Your preferences have been saved',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-secondary/10 rounded-full">
              <Sparkles className="h-8 w-8 text-secondary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Personalize Your Experience</CardTitle>
          <CardDescription>
            Help us tailor travel recommendations just for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Interests Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What interests you?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select all that apply (minimum 1)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <Badge
                  key={interest}
                  variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 text-sm hover:scale-105 transition-transform"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Budget Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What's your typical budget?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the range that fits your travel style
              </p>
            </div>
            <div className="grid gap-3">
              {BUDGET_RANGES.map((budget) => (
                <Card
                  key={budget.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedBudget === budget.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                  onClick={() => setSelectedBudget(budget.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{budget.label}</h4>
                        <p className="text-sm text-muted-foreground">{budget.desc}</p>
                      </div>
                      {selectedBudget === budget.value && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Button
            onClick={handleComplete}
            disabled={loading || selectedInterests.length === 0 || !selectedBudget}
            className="w-full"
            size="lg"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
