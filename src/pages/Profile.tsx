import { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Globe, Calendar, LogOut, MessageCircle, UserPlus, UserCheck, UserMinus, Lock, Unlock, X, Star, FileText, Users as UsersIcon, Ticket, Camera, BookOpen, Grid3X3, Settings, ChevronRight, Bookmark, Clock, CheckCircle, XCircle, Wallet, Heart, Menu } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/PostCard";
import { TravelGroupCard } from "@/components/TravelGroupCard";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  review_text: z.string().trim().min(10, "Review must be at least 10 characters").max(1000, "Review must be less than 1000 characters")
});

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  age: number | null;
  gender: string | null;
  date_of_birth: string | null;
  country: string | null;
  state: string | null;
  home_location: string | null;
  languages_spoken: string[] | null;
  interests: string[] | null;
  travel_preferences: string[] | null;
  avatar_url: string | null;
  is_public: boolean;
}


const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [likedTrips, setLikedTrips] = useState<any[]>([]);
  const [bucketList, setBucketList] = useState<any[]>([]);
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("none");
  const [canMessage, setCanMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  
  // Wallet state
  const [walletBalance] = useState(2500);
  
  // Saved posts state
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Review state
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Social activity state
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userSaves, setUserSaves] = useState<Set<string>>(new Set());
  const [userGroupMemberships, setUserGroupMemberships] = useState<Set<string>>(new Set());
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, [userId]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'wallet') {
      setActiveTab('wallet');
    }
  }, [searchParams]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

    setCurrentUserId(session.user.id);
    const targetUserId = userId || session.user.id;
    const isOwn = !userId || userId === session.user.id;
    setIsOwnProfile(isOwn);
    
    await loadProfile(targetUserId);
    await loadUserActivity(targetUserId);
    await loadSocialActivity(targetUserId, session.user.id);
    await loadFollowCounts(targetUserId);
    
    if (!isOwn) {
      await loadConnectionStatus(session.user.id, targetUserId);
    }
  };

  const loadFollowCounts = async (targetUserId: string) => {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", targetUserId),
      supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", targetUserId),
    ]);
    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
  };

  const loadConnectionStatus = async (currentId: string, targetId: string) => {
    const { data } = await supabase.rpc('get_connection_status', {
      user1_id: currentId,
      user2_id: targetId
    });

    const status = data || 'none';
    setConnectionStatus(status);

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("is_public")
      .eq("id", targetId)
      .single();

    setCanMessage(connectionStatus === 'connected');
  };

  const loadProfile = async (targetUserId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (!data && isOwnProfile) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const newProfile = {
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "",
          phone: null,
          bio: null,
          age: null,
          gender: null,
          date_of_birth: null,
          country: null,
          state: null,
          home_location: null,
          languages_spoken: [],
          interests: [],
          travel_preferences: [],
          avatar_url: null,
          is_public: true
        };

        const { error: insertError } = await supabase
          .from("profiles")
          .insert(newProfile);

        if (insertError) {
          toast({
            title: "Error",
            description: "Failed to create profile",
            variant: "destructive"
          });
        } else {
          setProfile(newProfile);
          toast({
            title: "Welcome!",
            description: "Your profile has been created. Please complete your details."
          });
          setEditing(true);
        }
      }
    } else {
      setProfile(data);
    }

    setLoading(false);
  };

  const loadUserActivity = async (targetUserId: string) => {
    const { data: likes } = await supabase
      .from("trip_likes")
      .select(`trip_id, trips:trip_id (*)`)
      .eq("user_id", targetUserId);

    if (likes) {
      setLikedTrips(likes.map(l => l.trips).filter(Boolean));
    }

    const { data: bucket } = await supabase
      .from("bucket_list")
      .select(`trip_id, trips:trip_id (*)`)
      .eq("user_id", targetUserId);

    if (bucket) {
      setBucketList(bucket.map(b => b.trips).filter(Boolean));
    }

    const { data: trips } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (trips) {
      setUserTrips(trips);
    }
  };

  const loadSocialActivity = async (targetUserId: string, currentId: string) => {
    const { data: posts } = await supabase
      .from("posts")
      .select(`*, profiles:user_id (full_name, avatar_url)`)
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (posts) {
      setUserPosts(posts);
    }

    const { data: groups } = await supabase
      .from("travel_groups")
      .select(`*, profiles:creator_id (full_name, avatar_url)`)
      .eq("creator_id", targetUserId)
      .order("created_at", { ascending: false });

    if (groups) {
      const groupsWithCounts = await Promise.all(
        (groups || []).map(async (group: any) => {
          const { count } = await supabase
            .from("travel_group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id)
            .eq("status", "accepted");

          return { ...group, member_count: count || 0 };
        })
      );
      setUserGroups(groupsWithCounts);
    }

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (bookings) {
      setUserBookings(bookings);
    }

    if (currentId) {
      const [likesData, savesData, membershipsData] = await Promise.all([
        supabase.from("post_likes").select("post_id").eq("user_id", currentId),
        supabase.from("post_saves").select("post_id").eq("user_id", currentId),
        supabase.from("travel_group_members").select("group_id").eq("user_id", currentId).eq("status", "accepted"),
      ]);

      if (likesData.data) {
        setUserLikes(new Set(likesData.data.map((l: any) => l.post_id)));
        
        // Fetch liked posts details
        const likedPostIds = likesData.data.map((l: any) => l.post_id);
        if (likedPostIds.length > 0) {
          const { data: likedPostsData } = await supabase
            .from("posts")
            .select(`*, profiles:user_id (full_name, avatar_url)`)
            .in("id", likedPostIds)
            .order("created_at", { ascending: false });
          
          if (likedPostsData) {
            setLikedPosts(likedPostsData);
          }
        }
      }
      if (savesData.data) {
        setUserSaves(new Set(savesData.data.map((s: any) => s.post_id)));
        
        // Fetch saved posts details
        const savedPostIds = savesData.data.map((s: any) => s.post_id);
        if (savedPostIds.length > 0) {
          const { data: savedPostsData } = await supabase
            .from("posts")
            .select(`*, profiles:user_id (full_name, avatar_url)`)
            .in("id", savedPostIds)
            .order("created_at", { ascending: false });
          
          if (savedPostsData) {
            setSavedPosts(savedPostsData);
          }
        }
      }
      if (membershipsData.data) setUserGroupMemberships(new Set(membershipsData.data.map((m: any) => m.group_id)));
    }
  };

  const handlePostUpdate = () => {
    if (currentUserId) {
      const targetUserId = userId || currentUserId;
      loadSocialActivity(targetUserId, currentUserId);
    }
  };

  const handleGroupUpdate = () => {
    if (currentUserId) {
      const targetUserId = userId || currentUserId;
      loadSocialActivity(targetUserId, currentUserId);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        age: profile.age,
        gender: profile.gender,
        date_of_birth: profile.date_of_birth,
        country: profile.country,
        state: profile.state,
        home_location: profile.home_location,
        languages_spoken: profile.languages_spoken,
        interests: profile.interests,
        travel_preferences: profile.travel_preferences,
        is_public: profile.is_public,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Profile updated successfully"
    });
    
    setEditing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleConnectionAction = async () => {
    if (!profile) return;

    if (connectionStatus === 'none') {
      const { error } = await supabase
        .from("user_connections")
        .insert({
          requester_id: currentUserId,
          addressee_id: profile.id,
          status: "pending"
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to send connection request",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Request Sent",
        description: "Connection request sent successfully"
      });
      
      await loadConnectionStatus(currentUserId, profile.id);
    } else if (connectionStatus === 'pending_sent') {
      const { error } = await supabase
        .from("user_connections")
        .delete()
        .eq("requester_id", currentUserId)
        .eq("addressee_id", profile.id)
        .eq("status", "pending");

      if (error) {
        toast({
          title: "Error",
          description: "Failed to cancel request",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Request Cancelled",
        description: "Connection request cancelled"
      });
      
      await loadConnectionStatus(currentUserId, profile.id);
    } else if (connectionStatus === 'connected') {
      const { error } = await supabase
        .from("user_connections")
        .delete()
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${currentUserId})`)
        .eq("status", "accepted");

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove connection",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Connection Removed",
        description: "User removed from your connections"
      });
      
      await loadConnectionStatus(currentUserId, profile.id);
    }
  };


  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleSubmitReview = async () => {
    try {
      const validatedData = reviewSchema.parse({
        rating,
        review_text: reviewText
      });

      setIsSubmittingReview(true);

      const { error } = await supabase
        .from("reviews")
        .insert({
          user_id: currentUserId,
          full_name: profile?.full_name || "Anonymous",
          email: profile?.email || "",
          rating: validatedData.rating,
          review_text: validatedData.review_text
        });

      if (error) throw error;

      toast({
        title: "Thank you for your feedback!",
        description: "Your review has been submitted successfully.",
      });

      setRating(0);
      setReviewText("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        toast({
          title: "Validation Error",
          description: firstError?.message || "Invalid input",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-primary animate-bounce" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />


      <main className="max-w-4xl mx-auto pb-20">
        {/* Instagram-style Profile Header */}
        <div className="relative">
          {/* Cover/Gradient Background */}
          <div className="h-32 md:h-48 bg-gradient-to-r from-primary/30 via-accent/20 to-secondary/30 rounded-b-3xl" />
          
          {/* Profile Info Section */}
          <div className="px-4 md:px-8 -mt-16 md:-mt-20">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-28 w-28 md:h-36 md:w-36 ring-4 ring-background shadow-xl">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl md:text-4xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <button className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Stats & Actions */}
              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.full_name || "Traveler"}</h1>
                  {isOwnProfile ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                        {editing ? "Cancel" : "Edit Profile"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {connectionStatus === 'none' && (
                        <Button size="sm" onClick={handleConnectionAction}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Follow
                        </Button>
                      )}
                      {connectionStatus === 'pending_sent' && (
                        <Button variant="outline" size="sm" onClick={handleConnectionAction}>
                          Requested
                        </Button>
                      )}
                      {connectionStatus === 'connected' && (
                        <Button variant="secondary" size="sm" onClick={handleConnectionAction}>
                          <UserCheck className="mr-1 h-4 w-4" />
                          Following
                        </Button>
                      )}
                      {canMessage && (
                        <Button variant="outline" size="sm" onClick={() => navigate('/wanderlust', { state: { selectedUserId: profile.id } })}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex justify-center md:justify-start gap-8 mb-4">
                  <div className="text-center">
                    <span className="text-xl font-bold">{userPosts.length}</span>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold">{followersCount}</span>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold">{followingCount}</span>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold">{userTrips.length}</span>
                    <p className="text-sm text-muted-foreground">Trips</p>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-muted-foreground max-w-lg">{profile.bio}</p>
                )}
                {profile.home_location && (
                  <div className="flex items-center justify-center md:justify-start gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {profile.home_location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Cards - Photo Vault, Knowledge Base & Wallet */}
        {isOwnProfile && (
          <div className="px-4 md:px-8 mt-8">
            <div className="grid grid-cols-3 gap-4">
              <Link to="/photo-vault" className="group">
                <Card className="overflow-hidden hover:shadow-lg transition-all border-0 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-orange-500/10 hover:scale-[1.02]">
                  <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg">
                      <Camera className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors truncate">Photo Vault</h3>
                      <p className="text-xs text-muted-foreground hidden md:block">Your memories</p>
                    </div>
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:translate-x-1 transition-transform hidden sm:block" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/knowledge" className="group">
                <Card className="overflow-hidden hover:shadow-lg transition-all border-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/10 hover:scale-[1.02]">
                  <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg">
                      <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors truncate">Knowledge</h3>
                      <p className="text-xs text-muted-foreground hidden md:block">Journals</p>
                    </div>
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:translate-x-1 transition-transform hidden sm:block" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/profile?tab=wallet" className="group">
                <Card className="overflow-hidden hover:shadow-lg transition-all border-0 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 hover:scale-[1.02]">
                  <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                      <Wallet className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors truncate">Wallet</h3>
                      <p className="text-xs text-muted-foreground hidden md:block">₹{walletBalance.toLocaleString()}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:translate-x-1 transition-transform hidden sm:block" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="px-4 md:px-8 mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`w-full grid ${isOwnProfile ? 'grid-cols-6' : 'grid-cols-4'} bg-muted/50 rounded-xl p-1`}>
              <TabsTrigger value="posts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Grid3X3 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="trips" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Globe className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Trips</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <UsersIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Groups</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Ticket className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Tickets</span>
              </TabsTrigger>
              {isOwnProfile && (
                <>
                  <TabsTrigger value="saved" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Bookmark className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Saved</span>
                  </TabsTrigger>
                  <TabsTrigger value="liked" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Heart className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Liked</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {userPosts.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-2xl">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold text-lg mb-1">No posts yet</h3>
                  <p className="text-muted-foreground text-sm">Share your travel adventures!</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-3">
                  {userPosts.map((post) => (
                    <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer">
                      {post.image_url ? (
                        <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 p-4">
                          <p className="text-xs text-center line-clamp-4">{post.content}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                        <span className="flex items-center gap-1">❤️ {post.likes_count || 0}</span>
                        <span className="flex items-center gap-1">💬 {post.comments_count || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trips" className="mt-6 space-y-4">
              {userTrips.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-2xl">
                  <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold text-lg mb-1">No trips yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Start planning your next adventure!</p>
                  <Button onClick={() => navigate("/ai-planner")}>Plan a Trip</Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {userTrips.map((trip) => (
                    <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {trip.image_url && (
                        <img src={trip.image_url} alt={trip.title} className="w-full h-40 object-cover" />
                      )}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{trip.title}</CardTitle>
                        <CardDescription>{trip.destination}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-6 space-y-4">
              {userGroups.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-2xl">
                  <UsersIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold text-lg mb-1">No groups yet</h3>
                  <p className="text-muted-foreground text-sm">Create or join travel groups!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {userGroups.map((group) => (
                    <TravelGroupCard
                      key={group.id}
                      group={group}
                      currentUserId={currentUserId}
                      isMember={userGroupMemberships.has(group.id)}
                      onUpdate={handleGroupUpdate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="mt-6 space-y-4">
              {(() => {
                const now = new Date();
                const upcomingBookings = userBookings.filter(b => 
                  b.status === "confirmed" && new Date(b.departure_date) >= now
                );
                const completedBookings = userBookings.filter(b => 
                  b.status === "confirmed" && new Date(b.departure_date) < now
                );
                const cancelledBookings = userBookings.filter(b => 
                  b.status === "cancelled"
                );

                const BookingCard = ({ booking }: { booking: any }) => (
                  <Card 
                    key={booking.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate('/ticket-details', { state: { booking } })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            booking.status === "cancelled" 
                              ? "bg-destructive/10" 
                              : new Date(booking.departure_date) < now 
                                ? "bg-green-500/10" 
                                : "bg-primary/10"
                          }`}>
                            {booking.status === "cancelled" ? (
                              <XCircle className="h-5 w-5 text-destructive" />
                            ) : new Date(booking.departure_date) < now ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{booking.from_location} → {booking.to_location}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{booking.booking_type} • {booking.service_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{booking.departure_date} • {booking.departure_time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            booking.status === "cancelled" 
                              ? "destructive" 
                              : new Date(booking.departure_date) < now 
                                ? "secondary" 
                                : "default"
                          }>
                            {booking.status === "cancelled" ? "Cancelled" : new Date(booking.departure_date) < now ? "Completed" : "Upcoming"}
                          </Badge>
                          <p className="text-sm font-semibold text-primary mt-1">₹{parseFloat(booking.price_inr).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );

                return (
                  <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-muted/50 rounded-xl p-1 mb-4">
                      <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        Upcoming ({upcomingBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed ({completedBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelled ({cancelledBookings.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming" className="space-y-3">
                      {upcomingBookings.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-2xl">
                          <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <h3 className="font-semibold mb-1">No upcoming journeys</h3>
                          <p className="text-muted-foreground text-sm mb-4">Book your next adventure!</p>
                          <Button onClick={() => navigate("/book-transport")}>Book Now</Button>
                        </div>
                      ) : (
                        upcomingBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
                      )}
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-3">
                      {completedBookings.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-2xl">
                          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <h3 className="font-semibold mb-1">No completed journeys</h3>
                          <p className="text-muted-foreground text-sm">Your travel history will appear here</p>
                        </div>
                      ) : (
                        completedBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
                      )}
                    </TabsContent>

                    <TabsContent value="cancelled" className="space-y-3">
                      {cancelledBookings.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-2xl">
                          <XCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <h3 className="font-semibold mb-1">No cancelled bookings</h3>
                          <p className="text-muted-foreground text-sm">That's great! Keep traveling</p>
                        </div>
                      ) : (
                        cancelledBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
                      )}
                    </TabsContent>
                  </Tabs>
                );
              })()}
            </TabsContent>

            {/* Saved Tab */}
            {isOwnProfile && (
              <TabsContent value="saved" className="mt-6 space-y-6">
                {savedPosts.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-2xl">
                    <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="font-semibold text-lg mb-1">No saved posts</h3>
                    <p className="text-muted-foreground text-sm">Posts you save will appear here</p>
                    <Button className="mt-4" onClick={() => navigate("/explore")}>
                      Explore Posts
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 md:gap-3">
                    {savedPosts.map((post) => (
                      <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer">
                        {post.image_url ? (
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 p-4">
                            <p className="text-xs text-center line-clamp-4">{post.content}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                          <span className="flex items-center gap-1">❤️ {post.likes_count || 0}</span>
                          <span className="flex items-center gap-1">💬 {post.comments_count || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Liked Tab */}
            {isOwnProfile && (
              <TabsContent value="liked" className="mt-6 space-y-6">
                {likedPosts.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-2xl">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="font-semibold text-lg mb-1">No liked posts</h3>
                    <p className="text-muted-foreground text-sm">Posts you like will appear here</p>
                    <Button className="mt-4" onClick={() => navigate("/explore")}>
                      Explore Posts
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 md:gap-3">
                    {likedPosts.map((post) => (
                      <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer">
                        {post.image_url ? (
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 p-4">
                            <p className="text-xs text-center line-clamp-4">{post.content}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                          <span className="flex items-center gap-1">❤️ {post.likes_count || 0}</span>
                          <span className="flex items-center gap-1">💬 {post.comments_count || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Edit Profile Section */}
        {isOwnProfile && editing && (
          <div className="px-4 md:px-8 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ""}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="home_location">Location</Label>
                    <Input
                      id="home_location"
                      value={profile.home_location || ""}
                      onChange={(e) => setProfile({ ...profile, home_location: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile.country || ""}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profile.is_public}
                      onCheckedChange={(checked) => setProfile({ ...profile, is_public: checked })}
                    />
                    <Label>Public Profile</Label>
                  </div>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review Section */}
        {isOwnProfile && (
          <div className="px-4 md:px-8 mt-8">
            <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent" />
                  Share Your Experience
                </CardTitle>
                <CardDescription>
                  Help us improve Travexa with your feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Tell us about your experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || rating === 0 || reviewText.length < 10}
                  className="w-full"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
