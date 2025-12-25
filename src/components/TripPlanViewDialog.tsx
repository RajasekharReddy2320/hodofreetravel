import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, IndianRupee, Clock, Download, Plane, Train, Bus, Utensils, Camera, Mountain, Building } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface TripPlanViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itinerary: any;
  currentUserId: string;
  isOwner: boolean;
}

export const TripPlanViewDialog = ({ open, onOpenChange, itinerary, currentUserId, isOwner }: TripPlanViewDialogProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  if (!itinerary) return null;

  const handleSavePlan = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("trips").insert({
        user_id: currentUserId,
        title: itinerary.title || `Trip to ${itinerary.destination}`,
        destination: itinerary.destination,
        start_date: itinerary.startDate,
        end_date: itinerary.endDate,
        trip_type: 'saved_from_post',
        planner_mode: itinerary.plannerMode || null,
        budget_inr: itinerary.estimatedBudget || null,
        itinerary: itinerary,
        is_public: false
      });

      if (error) throw error;

      toast({ 
        title: "Plan Saved!", 
        description: "This trip plan has been added to your saved trips." 
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getActivityIcon = (activity: string) => {
    const lowercaseActivity = activity.toLowerCase();
    if (lowercaseActivity.includes("food") || lowercaseActivity.includes("restaurant") || lowercaseActivity.includes("eat")) {
      return <Utensils className="h-4 w-4" />;
    } else if (lowercaseActivity.includes("photo") || lowercaseActivity.includes("sight")) {
      return <Camera className="h-4 w-4" />;
    } else if (lowercaseActivity.includes("trek") || lowercaseActivity.includes("hike") || lowercaseActivity.includes("mountain")) {
      return <Mountain className="h-4 w-4" />;
    } else if (lowercaseActivity.includes("museum") || lowercaseActivity.includes("temple") || lowercaseActivity.includes("monument")) {
      return <Building className="h-4 w-4" />;
    }
    return <MapPin className="h-4 w-4" />;
  };

  const getTransportIcon = (type?: string) => {
    if (!type) return <Plane className="h-4 w-4" />;
    const lowercaseType = type.toLowerCase();
    if (lowercaseType.includes("train")) return <Train className="h-4 w-4" />;
    if (lowercaseType.includes("bus")) return <Bus className="h-4 w-4" />;
    return <Plane className="h-4 w-4" />;
  };

  // Handle both day-by-day itinerary and simple activities list
  const days = itinerary.days || itinerary.itinerary?.days;
  const activities = itinerary.activities || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            Trip to {itinerary.destination}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Trip Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Dates</p>
                  <p className="text-sm font-medium">
                    {itinerary.startDate && itinerary.endDate ? (
                      `${format(new Date(itinerary.startDate), "MMM dd")} - ${format(new Date(itinerary.endDate), "MMM dd")}`
                    ) : "Not specified"}
                  </p>
                </div>
              </div>

              {itinerary.estimatedBudget > 0 && (
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm font-medium">₹{itinerary.estimatedBudget.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {itinerary.transportation && (
                <div className="flex items-center gap-2">
                  {getTransportIcon(itinerary.transportation)}
                  <div>
                    <p className="text-xs text-muted-foreground">Transport</p>
                    <p className="text-sm font-medium">{itinerary.transportation}</p>
                  </div>
                </div>
              )}

              {itinerary.plannerMode && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mode</p>
                    <Badge variant="secondary" className="capitalize text-xs">{itinerary.plannerMode}</Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Day-by-Day Itinerary */}
            {days && days.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Day-by-Day Plan</h3>
                {days.map((day: any, idx: number) => (
                  <div key={idx} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/10">Day {day.day || idx + 1}</Badge>
                      {day.date && <span className="text-sm text-muted-foreground">{format(new Date(day.date), "EEEE, MMM dd")}</span>}
                    </div>
                    
                    {day.activities && day.activities.length > 0 && (
                      <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                        {day.activities.map((activity: any, aIdx: number) => (
                          <div key={aIdx} className="flex items-start gap-3 p-2 bg-muted/20 rounded-lg">
                            <div className="p-1.5 bg-primary/10 rounded-lg mt-0.5">
                              {getActivityIcon(typeof activity === 'string' ? activity : activity.name || '')}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {typeof activity === 'string' ? activity : activity.name}
                              </p>
                              {activity.time && <p className="text-xs text-muted-foreground">{activity.time}</p>}
                              {activity.description && <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {day.meals && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Utensils className="h-4 w-4" />
                        <span>Meals: {Array.isArray(day.meals) ? day.meals.join(', ') : day.meals}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Simple Activities List */}
            {!days && activities.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Planned Activities</h3>
                <div className="flex flex-wrap gap-2">
                  {activities.map((activity: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3">
                      {getActivityIcon(activity)}
                      {activity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {itinerary.notes && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Notes</h3>
                <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl">{itinerary.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!isOwner && (
            <Button onClick={handleSavePlan} disabled={isSaving} className="gap-2">
              <Download className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save This Plan"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
