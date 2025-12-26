import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, Trash2, MapPin, Calendar, Plane, IndianRupee, Send, Edit2, Download, Eye } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { CommentsSection } from "./CommentsSection";
import { ItineraryBookingDialog } from "./ItineraryBookingDialog";
import { TripPlanViewDialog } from "./TripPlanViewDialog";
import { ConnectButton } from "./ConnectButton";
import { EditPostDialog } from "./EditPostDialog";
import { SharePostDialog } from "./SharePostDialog";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    itinerary?: any;
    likes_count: number;
    comments_count: number;
    created_at: string;
    user_id: string;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  currentUserId: string;
  userLiked: boolean;
  userSaved: boolean;
  onUpdate: () => void;
}

export const PostCard = ({ post, currentUserId, userLiked, userSaved, onUpdate }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPlanViewDialog, setShowPlanViewDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLike = async () => {
    try {
      if (userLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
      } else {
        await supabase.from("post_likes").insert({
          post_id: post.id,
          user_id: currentUserId,
        });
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

  const handleSave = async () => {
    try {
      if (userSaved) {
        await supabase
          .from("post_saves")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
      } else {
        await supabase.from("post_saves").insert({
          post_id: post.id,
          user_id: currentUserId,
        });
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

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({ title: "Post deleted successfully" });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSavePlanToTrips = async () => {
    if (!post.itinerary) return;
    
    setIsSavingPlan(true);
    try {
      const itinerary = post.itinerary;
      
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
    } catch (error: any) {
      toast({
        title: "Error saving plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDirectMessage = () => {
    navigate("/", { state: { openMessages: true, userId: post.user_id } });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isOwner = post.user_id === currentUserId;
  const isFromSavedPlan = post.itinerary?.isFromSavedPlan;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <Avatar className="cursor-pointer" onClick={() => navigate(`/profile/${post.user_id}`)}>
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback>{getInitials(post.profiles.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/profile/${post.user_id}`)}>
              {post.profiles.full_name || "Unknown User"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
          {!isOwner && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleDirectMessage} title="Send Message">
                <Send className="h-4 w-4" />
              </Button>
              <ConnectButton userId={post.user_id} currentUserId={currentUserId} />
            </div>
          )}
          {isOwner && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(true)} title="Edit Post">
                <Edit2 className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Post</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this post? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <p className="whitespace-pre-wrap">{post.content}</p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post"
              className="w-full rounded-lg object-cover max-h-96"
            />
          )}
          
          {post.itinerary && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  {isFromSavedPlan ? "Shared Trip Plan" : "Travel Itinerary"}
                </h3>
                <Badge variant="secondary">
                  {isFromSavedPlan ? "Full Plan" : "Bookable"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="font-medium">{post.itinerary.destination}</p>
                  </div>
                </div>
                
                {post.itinerary.transportation && (
                  <div className="flex items-center gap-2 text-sm">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Transportation</p>
                      <p className="font-medium">{post.itinerary.transportation}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Travel Dates</p>
                    <p className="font-medium">
                      {format(new Date(post.itinerary.startDate), "MMM dd")} - {format(new Date(post.itinerary.endDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                
                {post.itinerary.estimatedBudget > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-medium">₹{post.itinerary.estimatedBudget.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {post.itinerary.activities && post.itinerary.activities.length > 0 && (
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Activities</p>
                  <div className="flex flex-wrap gap-1">
                    {post.itinerary.activities.slice(0, 5).map((activity: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                    {post.itinerary.activities.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.itinerary.activities.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {post.itinerary.plannerMode && (
                <Badge variant="secondary" className="capitalize">
                  {post.itinerary.plannerMode} Mode
                </Badge>
              )}
              
              <div className="flex gap-2">
                {isFromSavedPlan ? (
                  // For shared trip plans - show View Plan and Save This Plan
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => setShowPlanViewDialog(true)}
                      className="flex-1 gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Plan
                    </Button>
                    {!isOwner && (
                      <Button 
                        onClick={handleSavePlanToTrips}
                        disabled={isSavingPlan}
                        className="flex-1 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {isSavingPlan ? "Saving..." : "Save This Plan"}
                      </Button>
                    )}
                  </>
                ) : (
                  // For regular itineraries - show Book Now
                  <>
                    <Button 
                      onClick={() => setShowBookingDialog(true)}
                      className="flex-1 gap-2"
                    >
                      <Plane className="h-4 w-4" />
                      Book Now
                    </Button>
                    {!isOwner && (
                      <Button 
                        variant="outline"
                        onClick={handleSavePlanToTrips}
                        disabled={isSavingPlan}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {isSavingPlan ? "Saving..." : "Save Plan"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        {post.itinerary && (
          <>
            <ItineraryBookingDialog
              open={showBookingDialog}
              onOpenChange={setShowBookingDialog}
              itinerary={post.itinerary}
              postAuthor={post.profiles.full_name || "Unknown User"}
            />
            <TripPlanViewDialog
              open={showPlanViewDialog}
              onOpenChange={setShowPlanViewDialog}
              itinerary={post.itinerary}
              currentUserId={currentUserId}
              isOwner={isOwner}
            />
          </>
        )}
        <CardFooter className="flex flex-col gap-3 pt-3 border-t">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${userLiked ? "fill-red-500 text-red-500" : ""}`} />
              {post.likes_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Bookmark className={`h-4 w-4 ${userSaved ? "fill-current" : ""}`} />
            </Button>
          </div>
          {showComments && (
            <CommentsSection
              postId={post.id}
              currentUserId={currentUserId}
              onCommentAdded={onUpdate}
            />
          )}
        </CardFooter>
      </Card>

      <EditPostDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        post={post}
        onPostUpdated={onUpdate}
      />

      <SharePostDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        postId={post.id}
        postContent={post.content}
        postAuthor={post.profiles.full_name || "Unknown User"}
      />
    </>
  );
};
