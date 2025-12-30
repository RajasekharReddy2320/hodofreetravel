import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MapPin, Calendar, Plane, Train, Bus, MessageCircle, Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { GroupChat } from "./GroupChat"; // Ensure this imports the new component above

interface TravelGroupCardProps {
  group: {
    id: string;
    title: string;
    from_location: string;
    to_location: string;
    travel_date: string;
    travel_mode: string;
    max_members: number;
    description: string | null;
    creator_id: string;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
    };
    member_count: number;
  };
  currentUserId: string;
  isMember: boolean;
  onUpdate: () => void;
}

export const TravelGroupCard = ({ group, currentUserId, isMember, onUpdate }: TravelGroupCardProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const { toast } = useToast();

  const handleJoin = async () => {
    try {
      if (isMember) {
        await supabase.from("travel_group_members").delete().eq("group_id", group.id).eq("user_id", currentUserId);
        toast({ title: "Left the group" });
      } else {
        await supabase.from("travel_group_members").insert({
          group_id: group.id,
          user_id: currentUserId,
          status: "accepted",
        });
        toast({ title: "Joined the group!" });
      }
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("travel_groups").delete().eq("id", group.id);

      if (error) throw error;

      toast({ title: "Travel group deleted successfully" });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error deleting group",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getModeIcon = () => {
    switch (group.travel_mode) {
      case "flight":
        return <Plane className="h-4 w-4" />;
      case "train":
        return <Train className="h-4 w-4" />;
      case "bus":
        return <Bus className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isCreator = group.creator_id === currentUserId;

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <CardTitle className="text-lg truncate" title={group.title}>
                {group.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={group.profiles.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{getInitials(group.profiles.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">{group.profiles.full_name || "Unknown"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="secondary" className="gap-1 h-7">
                <Users className="h-3 w-3" />
                {group.member_count}/{group.max_members}
              </Badge>
              {isCreator && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Travel Group</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this travel group? All members will be removed and this action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {group.from_location} → {group.to_location}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{format(new Date(group.travel_date), "PPP")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {getModeIcon()}
            <span className="capitalize">{group.travel_mode}</span>
          </div>
          {group.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{group.description}</p>}
        </CardContent>
        <CardFooter className="flex gap-2 pt-2">
          {isMember && (
            <Button variant="secondary" className="flex-1" onClick={() => setChatOpen(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
          )}
          <Button
            className={isMember ? "flex-1" : "w-full"}
            variant={isMember ? "outline" : "default"}
            onClick={handleJoin}
            disabled={!isMember && group.member_count >= group.max_members}
          >
            {isMember ? "Leave" : group.member_count >= group.max_members ? "Full" : "Join"}
          </Button>
        </CardFooter>
      </Card>

      {/* Group Chat Dialog - Rendered outside the card layout flow via Portal but logically here */}
      <GroupChat
        groupId={group.id}
        groupTitle={group.title}
        fromLocation={group.from_location}
        toLocation={group.to_location}
        travelDate={group.travel_date}
        travelMode={group.travel_mode}
        open={chatOpen}
        onOpenChange={setChatOpen}
        currentUserId={currentUserId}
      />
    </>
  );
};
