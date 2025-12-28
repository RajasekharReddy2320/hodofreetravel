import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardNav from "@/components/DashboardNav";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { CreateTravelGroupDialog } from "@/components/CreateTravelGroupDialog";
import { TravelGroupCard } from "@/components/TravelGroupCard";
import { PostCard } from "@/components/PostCard";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Users, Bookmark, Search, Send, UserCheck, UserPlus, Clock, X, Check, Rss, Palette, MapPin, Plane } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { z } from "zod";
import { useHoverRevealSidebar } from "@/hooks/useAutoHideNav";
interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}
interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}
interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  requester?: Profile;
  addressee?: Profile;
}
interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}
interface Conversation {
  user: Profile;
  lastMessage: Message | null;
  unreadCount: number;
}

interface TravelGroup {
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
}

interface BuddySearchResult {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  home_location: string | null;
  connection_status: string;
}
const MESSAGE_THEMES = [{
  id: 'default',
  name: 'Default',
  primary: 'bg-primary',
  secondary: 'bg-muted'
}, {
  id: 'ocean',
  name: 'Ocean',
  primary: 'bg-blue-500',
  secondary: 'bg-blue-100'
}, {
  id: 'forest',
  name: 'Forest',
  primary: 'bg-green-600',
  secondary: 'bg-green-100'
}, {
  id: 'sunset',
  name: 'Sunset',
  primary: 'bg-orange-500',
  secondary: 'bg-orange-100'
}, {
  id: 'purple',
  name: 'Purple',
  primary: 'bg-purple-600',
  secondary: 'bg-purple-100'
}, {
  id: 'rose',
  name: 'Rose',
  primary: 'bg-pink-500',
  secondary: 'bg-pink-100'
}];
const messageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long")
});
type TabType = 'feed' | 'connections' | 'messages' | 'saved' | 'find-buddies' | 'nearby' | 'travel-with-me' | 'travel-groups';

const VALID_TABS: TabType[] = ['feed', 'connections', 'messages', 'saved', 'find-buddies', 'nearby', 'travel-with-me', 'travel-groups'];

const Explore = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const {
    toast
  } = useToast();
  const {
    isSidebarVisible,
    sidebarProps
  } = useHoverRevealSidebar();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [messageTheme, setMessageTheme] = useState('default');
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Nearby travelers state
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyTravelers, setNearbyTravelers] = useState<BuddySearchResult[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Sync tab from URL
  useEffect(() => {
    if (tab && VALID_TABS.includes(tab as TabType)) {
      setActiveTab(tab as TabType);
    }
  }, [tab]);

  // Update URL when tab changes
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    navigate(`/explore/${newTab}`, { replace: true });
  };

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userSaves, setUserSaves] = useState<Set<string>>(new Set());

  // Connections state
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Connection[]>([]);
  const [pendingSent, setPendingSent] = useState<Connection[]>([]);

  // Messages state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<Profile[]>([]);

  // Travel Buddies state
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [userGroupMemberships, setUserGroupMemberships] = useState<Set<string>>(new Set());
  const [buddySearchQuery, setBuddySearchQuery] = useState("");
  const [buddyDestination, setBuddyDestination] = useState("");
  const [buddyInterest, setBuddyInterest] = useState("");
  const [buddySearchResults, setBuddySearchResults] = useState<BuddySearchResult[]>([]);
  const [buddySearchLoading, setBuddySearchLoading] = useState(false);
  useEffect(() => {
    checkAuthAndLoad();
  }, []);
  const checkAuthAndLoad = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/welcome");
      return;
    }
    setCurrentUserId(session.user.id);
    await Promise.all([loadPosts(), loadUserInteractions(session.user.id), loadConnections(session.user.id), loadAllUsers(), loadConversations(), loadTravelGroups(), loadUserGroupMemberships(session.user.id)]);
    setIsLoading(false);
  };

  // Travel Groups functions
  const loadTravelGroups = async () => {
    const { data, error } = await supabase
      .from("travel_groups")
      .select(`
        *,
        profiles:creator_id (
          full_name,
          avatar_url
        )
      `)
      .gte("travel_date", new Date().toISOString().split("T")[0])
      .order("travel_date", { ascending: true });

    if (error) {
      console.error("Error loading travel groups:", error);
      return;
    }

    const groupsWithCounts = await Promise.all(
      (data || []).map(async (group: any) => {
        const { count } = await (supabase as any)
          .from("travel_group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id)
          .eq("status", "accepted");

        return { ...group, member_count: count || 0 };
      })
    );

    setTravelGroups(groupsWithCounts as any);
  };

  const loadUserGroupMemberships = async (userId: string) => {
    const { data } = await supabase
      .from("travel_group_members")
      .select("group_id")
      .eq("user_id", userId)
      .eq("status", "accepted");

    if (data) {
      setUserGroupMemberships(new Set(data.map((m) => m.group_id)));
    }
  };

  const handleGroupUpdate = () => {
    loadTravelGroups();
    if (currentUserId) {
      loadUserGroupMemberships(currentUserId);
    }
  };

  const performBuddySearch = async () => {
    if (!currentUserId) return;
    
    setBuddySearchLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId);

      if (buddySearchQuery.trim()) {
        query = query.ilike("full_name", `%${buddySearchQuery}%`);
      }

      if (buddyDestination.trim()) {
        query = query.or(`home_location.ilike.%${buddyDestination}%,country.ilike.%${buddyDestination}%,state.ilike.%${buddyDestination}%`);
      }

      if (buddyInterest) {
        query = query.contains("interests", [buddyInterest]);
      }

      const { data: profiles, error } = await query.limit(20);

      if (error) throw error;

      const profilesWithStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: statusData } = await supabase.rpc("get_connection_status", {
            user1_id: currentUserId,
            user2_id: profile.id,
          });

          return {
            ...profile,
            connection_status: statusData || "none",
          };
        })
      );

      setBuddySearchResults(profilesWithStatus);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBuddySearchLoading(false);
    }
  };

  const sendBuddyConnectionRequest = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase.from("user_connections").insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Connection request sent successfully",
      });

      performBuddySearch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Geolocation and nearby travelers
  const requestLocation = async () => {
    setLocationError(null);
    setNearbyLoading(true);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setNearbyLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        await loadNearbyTravelers(latitude, longitude);
        setNearbyLoading(false);
      },
      (error) => {
        setNearbyLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable it in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const loadNearbyTravelers = async (lat: number, lng: number) => {
    if (!currentUserId) return;

    try {
      // For now, load users from similar locations/countries
      // In production, you'd use PostGIS for distance calculations
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("country, state, home_location")
        .eq("id", currentUserId)
        .single();

      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId);

      // Filter by same country/state if available
      if (userProfile?.country) {
        query = query.eq("country", userProfile.country);
      }

      const { data: profiles, error } = await query.limit(20);

      if (error) throw error;

      const profilesWithStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: statusData } = await supabase.rpc("get_connection_status", {
            user1_id: currentUserId,
            user2_id: profile.id,
          });

          return {
            ...profile,
            connection_status: statusData || "none",
          };
        })
      );

      setNearbyTravelers(profilesWithStatus);
      toast({
        title: "Location enabled",
        description: `Found ${profilesWithStatus.length} travelers in your area`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Posts functions
  const loadPosts = async () => {
    const {
      data,
      error
    } = await supabase.from("posts").select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `).order("created_at", {
      ascending: false
    });
    if (error) {
      toast({
        title: "Error loading posts",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    setPosts(data as any);
  };
  const loadUserInteractions = async (userId: string) => {
    const [likesData, savesData] = await Promise.all([supabase.from("post_likes").select("post_id").eq("user_id", userId), supabase.from("post_saves").select("post_id").eq("user_id", userId)]);
    if (likesData.data) setUserLikes(new Set(likesData.data.map((l: any) => l.post_id)));
    if (savesData.data) setUserSaves(new Set(savesData.data.map((s: any) => s.post_id)));
  };
  const handlePostUpdate = () => {
    if (currentUserId) {
      loadPosts();
      loadUserInteractions(currentUserId);
    }
  };

  // Connections functions
  const loadConnections = async (userId: string) => {
    const {
      data: accepted
    } = await supabase.from("user_connections").select("*").eq("status", "accepted").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (accepted) {
      const userIds = [...new Set(accepted.flatMap(c => [c.requester_id, c.addressee_id]))];
      const {
        data: profiles
      } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const connectionsWithProfiles = accepted.map(conn => ({
        ...conn,
        requester: profileMap.get(conn.requester_id),
        addressee: profileMap.get(conn.addressee_id)
      }));
      setConnections(connectionsWithProfiles as Connection[]);
    }
    const {
      data: received
    } = await supabase.from("user_connections").select("*").eq("addressee_id", userId).eq("status", "pending");
    if (received) {
      const userIds = received.map(r => r.requester_id);
      const {
        data: profiles
      } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const requestsWithProfiles = received.map(req => ({
        ...req,
        requester: profileMap.get(req.requester_id)
      }));
      setPendingReceived(requestsWithProfiles as Connection[]);
    }
    const {
      data: sent
    } = await supabase.from("user_connections").select("*").eq("requester_id", userId).eq("status", "pending");
    if (sent) {
      const userIds = sent.map(s => s.addressee_id);
      const {
        data: profiles
      } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const requestsWithProfiles = sent.map(req => ({
        ...req,
        addressee: profileMap.get(req.addressee_id)
      }));
      setPendingSent(requestsWithProfiles as Connection[]);
    }
  };
  const acceptConnection = async (connectionId: string) => {
    const {
      error
    } = await supabase.from("user_connections").update({
      status: "accepted"
    }).eq("id", connectionId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept connection",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Connection Accepted",
      description: "You are now connected!"
    });
    if (currentUserId) loadConnections(currentUserId);
  };
  const rejectConnection = async (connectionId: string) => {
    const {
      error
    } = await supabase.from("user_connections").delete().eq("id", connectionId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject connection",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Request Rejected"
    });
    if (currentUserId) loadConnections(currentUserId);
  };
  const removeConnection = async (connectionId: string) => {
    const {
      error
    } = await supabase.from("user_connections").delete().eq("id", connectionId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove connection",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Connection Removed"
    });
    if (currentUserId) loadConnections(currentUserId);
  };

  // Messages functions
  const loadAllUsers = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data
    } = await supabase.from("public_profiles").select("id, full_name, avatar_url").neq("id", user.id);
    setAllUsers(data || []);
  };
  const loadConversations = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data: allMessages
    } = await supabase.from("messages").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", {
      ascending: false
    });
    const userIds = new Set<string>();
    allMessages?.forEach(msg => {
      if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
      if (msg.recipient_id !== user.id) userIds.add(msg.recipient_id);
    });
    const {
      data: profiles
    } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", Array.from(userIds));
    const convos: Conversation[] = [];
    profiles?.forEach(profile => {
      const userMessages = allMessages?.filter(msg => msg.sender_id === profile.id || msg.recipient_id === profile.id) || [];
      const unreadCount = userMessages.filter(msg => msg.recipient_id === user.id && msg.sender_id === profile.id && !msg.read).length;
      convos.push({
        user: profile,
        lastMessage: userMessages[0] || null,
        unreadCount
      });
    });
    setConversations(convos);
  };
  const loadMessages = async () => {
    if (!selectedUser || !currentUserId) return;
    const {
      data
    } = await supabase.from("messages").select("*").or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${currentUserId})`).order("created_at", {
      ascending: true
    });
    setMessages(data || []);

    // Mark as read
    await supabase.from("messages").update({
      read: true
    }).eq("recipient_id", currentUserId).eq("sender_id", selectedUser.id).eq("read", false);
    loadConversations();
  };
  useEffect(() => {
    if (selectedUser) loadMessages();
  }, [selectedUser]);
  const sendMessage = async () => {
    if (!selectedUser || !currentUserId) return;
    const validation = messageSchema.safeParse({
      content: messageText
    });
    if (!validation.success) {
      toast({
        title: "Invalid Message",
        description: validation.error.issues[0].message,
        variant: "destructive"
      });
      return;
    }
    const {
      error
    } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      recipient_id: selectedUser.id,
      content: validation.data.content
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return;
    }
    setMessageText("");
    loadMessages();
    loadConversations();
  };
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };
  const filteredUsers = allUsers.filter(user => user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const currentTheme = MESSAGE_THEMES.find(t => t.id === messageTheme) || MESSAGE_THEMES[0];

  // Realtime subscriptions
  useEffect(() => {
    if (!currentUserId) return;
    const postsChannel = supabase.channel("posts-changes").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "posts"
    }, () => loadPosts()).subscribe();
    const messagesChannel = supabase.channel("messages").on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `recipient_id=eq.${currentUserId}`
    }, payload => {
      if (selectedUser && payload.new.sender_id === selectedUser.id) {
        setMessages(prev => [...prev, payload.new as Message]);
      }
      loadConversations();
    }).subscribe();
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId, selectedUser]);
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  const tabs = [{
    id: 'feed' as const,
    label: 'Tramigos',
    icon: Rss
  }, {
    id: 'messages' as const,
    label: 'Messages',
    icon: MessageSquare
  }, {
    id: 'travel-groups' as const,
    label: 'Travel Groups',
    icon: Plane
  }, {
    id: 'find-buddies' as const,
    label: 'Find Tramigos',
    icon: Search
  }, {
    id: 'nearby' as const,
    label: 'Nearby',
    icon: MapPin
  }, {
    id: 'travel-with-me' as const,
    label: 'Travel With Me',
    icon: UserPlus
  }, {
    id: 'connections' as const,
    label: 'Connections',
    icon: Users,
    badge: pendingReceived.length
  }];
  const profileTabs = [{
    id: 'saved' as const,
    label: 'Saved',
    icon: Bookmark
  }];
  return <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tramigos</h1>
          <CreatePostDialog onPostCreated={handlePostUpdate} />
        </div>

        <div className="flex gap-6">
          {/* Hover-Reveal Sidebar Tabs */}
          <div {...sidebarProps} className={`fixed left-0 top-20 h-[calc(100vh-5rem)] z-40 transition-all duration-300 ease-in-out ${isSidebarVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
            <div className="bg-background/95 backdrop-blur-sm border-r shadow-lg h-full p-3 space-y-2 w-48 flex flex-col">
              <div className="space-y-2 flex-1">
                {tabs.map(tabItem => {
                const Icon = tabItem.icon;
                return <button key={tabItem.id} onClick={() => handleTabChange(tabItem.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === tabItem.id ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="font-medium">{tabItem.label}</span>
                      {tabItem.badge && tabItem.badge > 0 && <span className="ml-auto bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {tabItem.badge}
                        </span>}
                    </button>;
              })}
              </div>
              
              {/* Profile Section */}
              
            </div>
          </div>
          
          {/* Hover trigger zone */}
          <div className="fixed left-0 top-20 w-4 h-[calc(100vh-5rem)] z-30" onMouseEnter={() => sidebarProps.onMouseEnter()} />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 mx-auto max-w-3xl">
            {/* Feed Tab */}
            {activeTab === 'feed' && <div className="space-y-6">
                {posts.length === 0 ? <div className="text-center py-12">
                    <p className="text-muted-foreground">No posts yet. Be the first to share your travel story!</p>
                  </div> : posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId!} userLiked={userLikes.has(post.id)} userSaved={userSaves.has(post.id)} onUpdate={handlePostUpdate} />)}
              </div>}

            {/* Connections Tab */}
            {activeTab === 'connections' && <div className="space-y-6">
                {/* Connection Sub-tabs */}
                <div className="flex gap-2 border-b pb-4">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Connected ({connections.length})
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    Requests ({pendingReceived.length})
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    Sent ({pendingSent.length})
                  </Button>
                </div>

                {connections.length === 0 ? <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No connections yet</p>
                    </CardContent>
                  </Card> : <div className="grid gap-4">
                    {connections.map(connection => {
                const otherUser = connection.requester_id === currentUserId ? connection.addressee : connection.requester;
                return <Card key={connection.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/profile/${otherUser?.id}`)}>
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={otherUser?.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(otherUser?.full_name || null)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold hover:underline">{otherUser?.full_name || "User"}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" /> Connected
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => {
                        setSelectedUser(otherUser || null);
                        setActiveTab('messages');
                      }}>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => removeConnection(connection.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>;
              })}
                  </div>}

                {/* Pending Requests */}
                {pendingReceived.length > 0 && <div className="mt-8">
                    <h3 className="font-semibold mb-4">Pending Requests</h3>
                    <div className="grid gap-4">
                      {pendingReceived.map(request => <Card key={request.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/profile/${request.requester?.id}`)}>
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={request.requester?.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(request.requester?.full_name || null)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold hover:underline">{request.requester?.full_name || "User"}</h3>
                                <p className="text-sm text-muted-foreground">Wants to connect</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => acceptConnection(request.id)}>
                                <Check className="h-4 w-4 mr-1" /> Accept
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => rejectConnection(request.id)}>
                                <X className="h-4 w-4 mr-1" /> Decline
                              </Button>
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>
                  </div>}
              </div>}

            {/* Messages Tab */}
            {activeTab === 'messages' && <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
                <Card className="md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" /> Conversations
                    </CardTitle>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      {searchQuery ? filteredUsers.map(user => <div key={user.id} className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 border-b ${selectedUser?.id === user.id ? "bg-muted" : ""}`} onClick={() => {
                    setSelectedUser(user);
                    setSearchQuery("");
                  }}>
                            <Avatar>
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{user.full_name || "User"}</p>
                              <p className="text-sm text-muted-foreground">Start a conversation</p>
                            </div>
                          </div>) : conversations.length > 0 ? conversations.map(convo => <div key={convo.user.id} className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 border-b ${selectedUser?.id === convo.user.id ? "bg-muted" : ""}`} onClick={() => setSelectedUser(convo.user)}>
                            <Avatar>
                              <AvatarImage src={convo.user.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(convo.user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{convo.user.full_name || "User"}</p>
                                {convo.unreadCount > 0 && <span className="bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {convo.unreadCount}
                                  </span>}
                              </div>
                              {convo.lastMessage && <p className="text-sm text-muted-foreground truncate">{convo.lastMessage.content}</p>}
                            </div>
                          </div>) : <div className="text-center py-12 px-4">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">No conversations yet</p>
                        </div>}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 flex flex-col">
                  {selectedUser ? <>
                      <CardHeader className="border-b py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="cursor-pointer" onClick={() => navigate(`/profile/${selectedUser.id}`)}>
                              <AvatarImage src={selectedUser.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{selectedUser.full_name || "User"}</CardTitle>
                              <CardDescription>Active now</CardDescription>
                            </div>
                          </div>
                          <div className="relative">
                            <Button variant="ghost" size="icon" onClick={() => setShowThemePicker(!showThemePicker)}>
                              <Palette className="h-4 w-4" />
                            </Button>
                            {showThemePicker && <div className="absolute right-0 top-full mt-2 bg-card border rounded-lg shadow-lg p-2 z-10">
                                <p className="text-xs text-muted-foreground mb-2 px-2">Chat Theme</p>
                                <div className="flex gap-1">
                                  {MESSAGE_THEMES.map(theme => <button key={theme.id} onClick={() => {
                            setMessageTheme(theme.id);
                            setShowThemePicker(false);
                          }} className={`w-8 h-8 rounded-full ${theme.primary} ${messageTheme === theme.id ? 'ring-2 ring-offset-2 ring-primary' : ''}`} title={theme.name} />)}
                                </div>
                              </div>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-[300px] p-4">
                          {messages.map(msg => <div key={msg.id} className={`mb-4 flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender_id === currentUserId ? `${currentTheme.primary} text-white` : currentTheme.secondary}`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs mt-1 opacity-70">{format(new Date(msg.created_at), "h:mm a")}</p>
                              </div>
                            </div>)}
                        </ScrollArea>
                      </CardContent>
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input placeholder="Type a message..." value={messageText} onChange={e => setMessageText(e.target.value)} onKeyPress={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }} />
                          <Button onClick={sendMessage} disabled={!messageText.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </> : <CardContent className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg text-muted-foreground">Select a conversation</p>
                      </div>
                    </CardContent>}
                </Card>
              </div>}

            {/* Saved Tab */}
            {activeTab === 'saved' && <div className="space-y-6">
                {posts.filter(p => userSaves.has(p.id)).length === 0 ? <div className="text-center py-12">
                    <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No saved posts yet</p>
                  </div> : posts.filter(p => userSaves.has(p.id)).map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId!} userLiked={userLikes.has(post.id)} userSaved={userSaves.has(post.id)} onUpdate={handlePostUpdate} />)}
              </div>}

            {/* Find Buddies Tab */}
            {activeTab === 'find-buddies' && (
              <Card>
                <CardHeader>
                  <CardTitle>Search for Travel Buddies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by name..."
                        value={buddySearchQuery}
                        onChange={(e) => setBuddySearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={performBuddySearch} disabled={buddySearchLoading}>
                        <Search className="h-4 w-4 mr-2" />
                        {buddySearchLoading ? "Searching..." : "Search"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Filter by destination..."
                        value={buddyDestination}
                        onChange={(e) => setBuddyDestination(e.target.value)}
                      />
                      <Select value={buddyInterest} onValueChange={setBuddyInterest}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by interest" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="beach">Beach</SelectItem>
                          <SelectItem value="culture">Culture</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="hiking">Hiking</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="wildlife">Wildlife</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {buddySearchResults.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Start searching to find travel buddies with similar interests</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {buddySearchResults.map((result) => (
                        <Card key={result.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Avatar 
                                className="h-12 w-12 cursor-pointer" 
                                onClick={() => navigate(`/profile/${result.id}`)}
                              >
                                <AvatarImage src={result.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(result.full_name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <CardTitle 
                                  className="text-base cursor-pointer hover:underline truncate"
                                  onClick={() => navigate(`/profile/${result.id}`)}
                                >
                                  {result.full_name || "Anonymous"}
                                </CardTitle>
                                {result.home_location && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                                    <MapPin className="h-3 w-3" />
                                    {result.home_location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {result.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{result.bio}</p>
                            )}
                            {result.interests && result.interests.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {result.interests.slice(0, 3).map((int, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {int}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              {result.connection_status === "connected" ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                      setSelectedUser({ id: result.id, full_name: result.full_name, avatar_url: result.avatar_url });
                                      setActiveTab('messages');
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Message
                                  </Button>
                                  <Button variant="outline" size="sm" disabled>
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Connected
                                  </Button>
                                </>
                              ) : result.connection_status === "pending_sent" ? (
                                <Button variant="outline" size="sm" className="flex-1" disabled>
                                  Pending
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => sendBuddyConnectionRequest(result.id)}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Connect
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Nearby Tab */}
            {activeTab === 'nearby' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Travelers Nearby
                  </CardTitle>
                  {userLocation && (
                    <p className="text-sm text-muted-foreground">
                      Location enabled • Showing travelers in your area
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {!userLocation ? (
                    <div className="text-center py-12">
                      <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Enable Location</h3>
                      <p className="text-muted-foreground mb-4">
                        Allow location access to find travelers near you
                      </p>
                      {locationError && (
                        <p className="text-sm text-destructive mb-4">{locationError}</p>
                      )}
                      <Button onClick={requestLocation} disabled={nearbyLoading}>
                        {nearbyLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                            Getting location...
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-2" />
                            Enable Location
                          </>
                        )}
                      </Button>
                    </div>
                  ) : nearbyTravelers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>No travelers found in your area yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => requestLocation()}>
                        Refresh
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {nearbyTravelers.map((traveler) => (
                        <Card key={traveler.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Avatar 
                                className="h-12 w-12 cursor-pointer" 
                                onClick={() => navigate(`/profile/${traveler.id}`)}
                              >
                                <AvatarImage src={traveler.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(traveler.full_name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <CardTitle 
                                  className="text-base cursor-pointer hover:underline truncate"
                                  onClick={() => navigate(`/profile/${traveler.id}`)}
                                >
                                  {traveler.full_name || "Anonymous"}
                                </CardTitle>
                                {traveler.home_location && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                                    <MapPin className="h-3 w-3" />
                                    {traveler.home_location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {traveler.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{traveler.bio}</p>
                            )}
                            {traveler.interests && traveler.interests.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {traveler.interests.slice(0, 3).map((int, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {int}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              {traveler.connection_status === "connected" ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                      setSelectedUser({ id: traveler.id, full_name: traveler.full_name, avatar_url: traveler.avatar_url });
                                      handleTabChange('messages');
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Message
                                  </Button>
                                  <Button variant="outline" size="sm" disabled>
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Connected
                                  </Button>
                                </>
                              ) : traveler.connection_status === "pending_sent" ? (
                                <Button variant="outline" size="sm" className="flex-1" disabled>
                                  <Clock className="h-4 w-4 mr-1" />
                                  Pending
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => sendBuddyConnectionRequest(traveler.id)}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Connect
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Travel With Me Tab */}
            {activeTab === 'travel-with-me' && (
              <Card>
                <CardHeader>
                  <CardTitle>Post Your Travel Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Share your travel plans and invite others to join you</p>
                    <Button className="mt-4">Create Travel Plan</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Travel Groups Tab */}
            {activeTab === 'travel-groups' && (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Travel Groups</h2>
                    <p className="text-muted-foreground">Find travel companions for your next adventure</p>
                  </div>
                  <CreateTravelGroupDialog onGroupCreated={handleGroupUpdate} />
                </div>
                
                {travelGroups.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12">
                      <div className="text-center text-muted-foreground">
                        <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No travel groups yet. Create one to find travel companions!</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {travelGroups.map((group) => (
                      <TravelGroupCard
                        key={group.id}
                        group={group}
                        currentUserId={currentUserId!}
                        isMember={userGroupMemberships.has(group.id)}
                        onUpdate={handleGroupUpdate}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>;
};
export default Explore;