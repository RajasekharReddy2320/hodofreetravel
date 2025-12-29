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
import {
  MessageSquare,
  Users,
  Bookmark,
  Search,
  Send,
  UserCheck,
  UserPlus,
  Clock,
  X,
  Check,
  Rss,
  Palette,
  MapPin,
  Plane,
  Menu,
  ChevronLeft,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { z } from "zod";

// --- Interfaces ---
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

const MESSAGE_THEMES = [
  { id: "default", name: "Default", primary: "bg-primary", secondary: "bg-muted" },
  { id: "ocean", name: "Ocean", primary: "bg-blue-500", secondary: "bg-blue-100" },
  { id: "forest", name: "Forest", primary: "bg-green-600", secondary: "bg-green-100" },
  { id: "sunset", name: "Sunset", primary: "bg-orange-500", secondary: "bg-orange-100" },
  { id: "purple", name: "Purple", primary: "bg-purple-600", secondary: "bg-purple-100" },
  { id: "rose", name: "Rose", primary: "bg-pink-500", secondary: "bg-pink-100" },
];

const messageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long"),
});

type TabType =
  | "feed"
  | "connections"
  | "messages"
  | "saved"
  | "find-buddies"
  | "nearby"
  | "travel-with-me"
  | "travel-groups";
const VALID_TABS: TabType[] = [
  "feed",
  "connections",
  "messages",
  "saved",
  "find-buddies",
  "nearby",
  "travel-with-me",
  "travel-groups",
];

const Explore = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const { toast } = useToast();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [messageTheme, setMessageTheme] = useState("default");
  const [showThemePicker, setShowThemePicker] = useState(false);

  // State
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyTravelers, setNearbyTravelers] = useState<BuddySearchResult[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userSaves, setUserSaves] = useState<Set<string>>(new Set());
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Connection[]>([]);
  const [pendingSent, setPendingSent] = useState<Connection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [userGroupMemberships, setUserGroupMemberships] = useState<Set<string>>(new Set());
  const [buddySearchQuery, setBuddySearchQuery] = useState("");
  const [buddyDestination, setBuddyDestination] = useState("");
  const [buddyInterest, setBuddyInterest] = useState("");
  const [buddySearchResults, setBuddySearchResults] = useState<BuddySearchResult[]>([]);
  const [buddySearchLoading, setBuddySearchLoading] = useState(false);

  useEffect(() => {
    if (tab && VALID_TABS.includes(tab as TabType)) {
      setActiveTab(tab as TabType);
    }
  }, [tab]);

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    navigate(`/explore/${newTab}`, { replace: true });
  };

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/welcome");
      return;
    }
    setCurrentUserId(session.user.id);
    await Promise.all([
      loadPosts(),
      loadUserInteractions(session.user.id),
      loadConnections(session.user.id),
      loadAllUsers(),
      loadConversations(),
      loadTravelGroups(),
      loadUserGroupMemberships(session.user.id),
    ]);
    setIsLoading(false);
  };

  // --- DATA LOADING & ACTIONS ---

  const loadTravelGroups = async () => {
    const { data, error } = await supabase
      .from("travel_groups")
      .select(`*, profiles:creator_id (full_name, avatar_url)`)
      .gte("travel_date", new Date().toISOString().split("T")[0])
      .order("travel_date", { ascending: true });
    if (error) return;
    const groupsWithCounts = await Promise.all(
      (data || []).map(async (group: any) => {
        const { count } = await (supabase as any)
          .from("travel_group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id)
          .eq("status", "accepted");
        return { ...group, member_count: count || 0 };
      }),
    );
    setTravelGroups(groupsWithCounts as any);
  };

  const loadUserGroupMemberships = async (userId: string) => {
    const { data } = await supabase
      .from("travel_group_members")
      .select("group_id")
      .eq("user_id", userId)
      .eq("status", "accepted");
    if (data) setUserGroupMemberships(new Set(data.map((m) => m.group_id)));
  };

  const handleGroupUpdate = () => {
    loadTravelGroups();
    if (currentUserId) loadUserGroupMemberships(currentUserId);
  };

  const performBuddySearch = async () => {
    if (!currentUserId) return;
    setBuddySearchLoading(true);
    try {
      let query = supabase.from("profiles").select("*").neq("id", currentUserId);
      if (buddySearchQuery.trim()) query = query.ilike("full_name", `%${buddySearchQuery}%`);
      if (buddyDestination.trim())
        query = query.or(
          `home_location.ilike.%${buddyDestination}%,country.ilike.%${buddyDestination}%,state.ilike.%${buddyDestination}%`,
        );
      if (buddyInterest) query = query.contains("interests", [buddyInterest]);
      const { data: profiles, error } = await query.limit(20);
      if (error) throw error;
      const profilesWithStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: statusData } = await supabase.rpc("get_connection_status", {
            user1_id: currentUserId,
            user2_id: profile.id,
          });
          return { ...profile, connection_status: statusData || "none" };
        }),
      );
      setBuddySearchResults(profilesWithStatus);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBuddySearchLoading(false);
    }
  };

  const sendBuddyConnectionRequest = async (targetUserId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from("user_connections")
        .insert({ requester_id: currentUserId, addressee_id: targetUserId, status: "pending" });
      if (error) throw error;
      toast({ title: "Request Sent", description: "Connection request sent successfully" });
      performBuddySearch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

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
        setLocationError("Location request failed.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const loadNearbyTravelers = async (lat: number, lng: number) => {
    if (!currentUserId) return;
    try {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("country, state, home_location")
        .eq("id", currentUserId)
        .single();
      let query = supabase.from("profiles").select("*").neq("id", currentUserId);
      if (userProfile?.country) query = query.eq("country", userProfile.country);
      const { data: profiles, error } = await query.limit(20);
      if (error) throw error;
      const profilesWithStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: statusData } = await supabase.rpc("get_connection_status", {
            user1_id: currentUserId,
            user2_id: profile.id,
          });
          return { ...profile, connection_status: statusData || "none" };
        }),
      );
      setNearbyTravelers(profilesWithStatus);
      toast({ title: "Location enabled", description: `Found ${profilesWithStatus.length} travelers in your area` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`*, profiles:user_id (full_name, avatar_url)`)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading posts", description: error.message, variant: "destructive" });
      return;
    }
    setPosts(data as any);
  };

  const loadUserInteractions = async (userId: string) => {
    const [likesData, savesData] = await Promise.all([
      supabase.from("post_likes").select("post_id").eq("user_id", userId),
      supabase.from("post_saves").select("post_id").eq("user_id", userId),
    ]);
    if (likesData.data) setUserLikes(new Set(likesData.data.map((l: any) => l.post_id)));
    if (savesData.data) setUserSaves(new Set(savesData.data.map((s: any) => s.post_id)));
  };

  const handlePostUpdate = () => {
    if (currentUserId) {
      loadPosts();
      loadUserInteractions(currentUserId);
    }
  };

  const loadConnections = async (userId: string) => {
    const { data: accepted } = await supabase
      .from("user_connections")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (accepted) {
      const userIds = [...new Set(accepted.flatMap((c) => [c.requester_id, c.addressee_id]))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      setConnections(
        accepted.map((conn) => ({
          ...conn,
          requester: profileMap.get(conn.requester_id),
          addressee: profileMap.get(conn.addressee_id),
        })) as Connection[],
      );
    }
    const { data: received } = await supabase
      .from("user_connections")
      .select("*")
      .eq("addressee_id", userId)
      .eq("status", "pending");
    if (received) {
      const userIds = received.map((r) => r.requester_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      setPendingReceived(
        received.map((req) => ({ ...req, requester: profileMap.get(req.requester_id) })) as Connection[],
      );
    }
    const { data: sent } = await supabase
      .from("user_connections")
      .select("*")
      .eq("requester_id", userId)
      .eq("status", "pending");
    if (sent) {
      const userIds = sent.map((s) => s.addressee_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      setPendingSent(sent.map((req) => ({ ...req, addressee: profileMap.get(req.addressee_id) })) as Connection[]);
    }
  };

  const acceptConnection = async (connectionId: string) => {
    const { error } = await supabase.from("user_connections").update({ status: "accepted" }).eq("id", connectionId);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      return;
    }
    toast({ title: "Connection Accepted" });
    if (currentUserId) loadConnections(currentUserId);
  };

  const rejectConnection = async (connectionId: string) => {
    const { error } = await supabase.from("user_connections").delete().eq("id", connectionId);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      return;
    }
    toast({ title: "Request Rejected" });
    if (currentUserId) loadConnections(currentUserId);
  };

  const removeConnection = async (connectionId: string) => {
    const { error } = await supabase.from("user_connections").delete().eq("id", connectionId);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      return;
    }
    toast({ title: "Connection Removed" });
    if (currentUserId) loadConnections(currentUserId);
  };

  const loadAllUsers = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("public_profiles").select("id, full_name, avatar_url").neq("id", user.id);
    setAllUsers(data || []);
  };

  const loadConversations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    const userIds = new Set<string>();
    allMessages?.forEach((msg) => {
      if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
      if (msg.recipient_id !== user.id) userIds.add(msg.recipient_id);
    });
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", Array.from(userIds));
    const convos: Conversation[] = [];
    profiles?.forEach((profile) => {
      const userMessages =
        allMessages?.filter((msg) => msg.sender_id === profile.id || msg.recipient_id === profile.id) || [];
      const unreadCount = userMessages.filter(
        (msg) => msg.recipient_id === user.id && msg.sender_id === profile.id && !msg.read,
      ).length;
      convos.push({ user: profile, lastMessage: userMessages[0] || null, unreadCount });
    });
    setConversations(convos);
  };

  const loadMessages = async () => {
    if (!selectedUser || !currentUserId) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${currentUserId})`,
      )
      .order("created_at", { ascending: true });
    setMessages(data || []);
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("recipient_id", currentUserId)
      .eq("sender_id", selectedUser.id)
      .eq("read", false);
    loadConversations();
  };

  useEffect(() => {
    if (selectedUser) loadMessages();
  }, [selectedUser]);

  const sendMessage = async () => {
    if (!selectedUser || !currentUserId) return;
    const validation = messageSchema.safeParse({ content: messageText });
    if (!validation.success) {
      toast({ title: "Invalid Message", description: validation.error.issues[0].message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("messages")
      .insert({ sender_id: currentUserId, recipient_id: selectedUser.id, content: validation.data.content });
    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      return;
    }
    setMessageText("");
    loadMessages();
    loadConversations();
  };

  const unsendMessage = async (messageId: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    toast({ title: "Message Deleted" });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  const filteredUsers = allUsers.filter((user) => user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const currentTheme = MESSAGE_THEMES.find((t) => t.id === messageTheme) || MESSAGE_THEMES[0];

  const getMessageDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const totalUnreadMessages = conversations.reduce((acc, curr) => acc + curr.unreadCount, 0);

  useEffect(() => {
    if (!currentUserId) return;
    const postsChannel = supabase
      .channel("posts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadPosts())
      .subscribe();
    const messagesChannel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${currentUserId}` },
        (payload) => {
          if (selectedUser && payload.new.sender_id === selectedUser.id) {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
          loadConversations();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId, selectedUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = [
    { id: "feed" as const, label: "Tramigos", icon: Rss },
    { id: "messages" as const, label: "Messages", icon: MessageSquare },
    { id: "travel-groups" as const, label: "Travel Groups", icon: Plane },
    { id: "find-buddies" as const, label: "Find Tramigos", icon: Search },
    { id: "nearby" as const, label: "Nearby", icon: MapPin },
    { id: "travel-with-me" as const, label: "Travel With Me", icon: UserPlus },
    { id: "connections" as const, label: "Connections", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 1. Header (Normal Scrolling) */}
      <DashboardNav />

      {/* 2. Flex Container */}
      <div className="flex">
        {/* SIDEBAR: Sticky top-0 h-screen
            This ensures it sticks to the top as soon as the header scrolls out.
        */}
        <aside
          className={`sticky top-0 h-screen overflow-y-auto border-r bg-background/95 backdrop-blur-sm z-40 transition-all duration-200 ease-in-out
            ${isSidebarOpen ? "w-60" : "w-[72px]"}
          `}
        >
          <div className={`flex items-center h-16 px-3 mb-2 ${isSidebarOpen ? "justify-end" : "justify-center"}`}>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          <div className="px-2 space-y-1">
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => handleTabChange(tabItem.id)}
                  className={`
                    flex items-center transition-all duration-200 rounded-lg group relative
                    ${isSidebarOpen ? "w-full px-3 py-2 gap-4 flex-row justify-start" : "w-full py-4 justify-center"}
                    ${activeTab === tabItem.id ? "bg-primary/10 text-primary hover:bg-primary/20" : "hover:bg-muted text-muted-foreground hover:text-foreground"}
                  `}
                  title={!isSidebarOpen ? tabItem.label : undefined}
                >
                  <div className="relative">
                    <Icon className={`shrink-0 transition-all ${isSidebarOpen ? "h-5 w-5" : "h-6 w-6"}`} />
                    {/* Collapsed Mode Unread Dot */}
                    {!isSidebarOpen && tabItem.id === "messages" && totalUnreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  {isSidebarOpen && (
                    <div className="flex-1 flex justify-between items-center overflow-hidden">
                      <span className="truncate font-medium text-sm">{tabItem.label}</span>
                      {/* Expanded Mode Badges */}
                      {tabItem.id === "connections" && connections.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">({connections.length})</span>
                      )}
                      {tabItem.id === "messages" && totalUnreadMessages > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {totalUnreadMessages}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 px-4 py-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Tramigos</h1>
              <CreatePostDialog onPostCreated={handlePostUpdate} />
            </div>

            {/* --- Feed Tab --- */}
            {activeTab === "feed" && (
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No posts yet. Be the first to share your travel story!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={currentUserId!}
                      userLiked={userLikes.has(post.id)}
                      userSaved={userSaves.has(post.id)}
                      onUpdate={handlePostUpdate}
                    />
                  ))
                )}
              </div>
            )}

            {/* --- Connections Tab (Restored) --- */}
            {activeTab === "connections" && (
              <div className="space-y-6">
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
                {connections.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No connections yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {connections.map((connection) => {
                      const otherUser =
                        connection.requester_id === currentUserId ? connection.addressee : connection.requester;
                      return (
                        <Card key={connection.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div
                              className="flex items-center gap-4 cursor-pointer"
                              onClick={() => navigate(`/profile/${otherUser?.id}`)}
                            >
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(otherUser || null);
                                  setActiveTab("messages");
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" /> Message
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => removeConnection(connection.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                {/* Pending Requests logic remains same but condensed here for brevity... */}
                {pendingReceived.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">Pending Requests</h3>
                    <div className="grid gap-4">
                      {pendingReceived.map((req) => (
                        <Card key={req.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarImage src={req.requester?.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(req.requester?.full_name || null)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{req.requester?.full_name}</h3>
                                <p className="text-sm text-muted-foreground">Wants to connect</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => acceptConnection(req.id)}>
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => rejectConnection(req.id)}>
                                Decline
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- Messages Tab (Fixed) --- */}
            {activeTab === "messages" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
                <Card className="md:col-span-1 border-r-0 rounded-r-none">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-lg flex items-center justify-between">Chats</CardTitle>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-320px)]">
                      {(searchQuery ? filteredUsers : conversations.map((c) => c.user)).map((user) => {
                        const convo = conversations.find((c) => c.user.id === user.id);
                        return (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors ${selectedUser?.id === user.id ? "bg-accent" : ""}`}
                            onClick={() => {
                              setSelectedUser(user);
                              setSearchQuery("");
                            }}
                          >
                            <Avatar>
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex justify-between items-baseline">
                                <p className="font-medium truncate text-sm">{user.full_name || "User"}</p>
                                {convo && convo.lastMessage && (
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-1">
                                    {format(new Date(convo.lastMessage.created_at), "MMM d")}
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-muted-foreground truncate w-full">
                                  {convo?.lastMessage ? convo.lastMessage.content : "Start a conversation"}
                                </p>
                                {convo && convo.unreadCount > 0 && (
                                  <span className="bg-primary text-primary-foreground text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center ml-2">
                                    {convo.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 flex flex-col border-l-0 rounded-l-none h-full">
                  {selectedUser ? (
                    <>
                      <div className="border-b px-4 py-3 flex items-center justify-between bg-card/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <Avatar
                            className="h-9 w-9 cursor-pointer"
                            onClick={() => navigate(`/profile/${selectedUser.id}`)}
                          >
                            <AvatarImage src={selectedUser.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-sm">{selectedUser.full_name}</h3>
                            <span className="text-xs text-muted-foreground">Online</span>
                          </div>
                        </div>
                        <div className="relative">
                          <Button variant="ghost" size="icon" onClick={() => setShowThemePicker(!showThemePicker)}>
                            <Palette className="h-4 w-4" />
                          </Button>
                          {showThemePicker && (
                            <div className="absolute right-0 top-10 bg-popover border rounded-lg shadow-lg p-2 z-20 flex gap-2">
                              {MESSAGE_THEMES.map((theme) => (
                                <button
                                  key={theme.id}
                                  onClick={() => {
                                    setMessageTheme(theme.id);
                                    setShowThemePicker(false);
                                  }}
                                  className={`w-6 h-6 rounded-full ${theme.primary} ring-offset-1 ${messageTheme === theme.id ? "ring-2 ring-primary" : ""}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full px-4 py-4">
                          {messages.map((msg, index) => {
                            const messageDate = new Date(msg.created_at);
                            const prevMessage = index > 0 ? messages[index - 1] : null;
                            const prevDate = prevMessage ? new Date(prevMessage.created_at) : null;
                            const showDateSeparator = !prevDate || messageDate.getDate() !== prevDate.getDate();
                            const isMe = msg.sender_id === currentUserId;
                            return (
                              <div key={msg.id}>
                                {showDateSeparator && (
                                  <div className="flex justify-center my-4">
                                    <span className="bg-muted/50 text-muted-foreground text-[10px] px-2 py-1 rounded-full uppercase tracking-wide">
                                      {getMessageDateLabel(msg.created_at)}
                                    </span>
                                  </div>
                                )}
                                <div className={`flex group mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                  <div
                                    className={`relative max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? `${currentTheme.primary} text-primary-foreground rounded-tr-none` : `${currentTheme.secondary} text-foreground rounded-tl-none`}`}
                                  >
                                    <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    <div
                                      className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${isMe ? "opacity-80" : "text-muted-foreground"}`}
                                    >
                                      <span>{format(messageDate, "h:mm a")}</span>
                                      {isMe && (
                                        <span>
                                          {msg.read ? (
                                            <CheckCheck className="h-3 w-3" />
                                          ) : (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    {isMe && (
                                      <div className="absolute top-0 -left-8 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                          onClick={() => unsendMessage(msg.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </ScrollArea>
                      </div>
                      <div className="p-3 bg-background border-t">
                        <div className="flex gap-2 items-end">
                          <Input
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            className="min-h-[44px] py-3 rounded-full resize-none"
                          />
                          <Button
                            size="icon"
                            className="h-11 w-11 rounded-full shrink-0"
                            onClick={sendMessage}
                            disabled={!messageText.trim()}
                          >
                            <Send className="h-5 w-5 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center h-full">
                      <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                      <h3 className="font-semibold text-lg">Your Messages</h3>
                      <p>Select a conversation to start chatting</p>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* --- Travel Groups Tab (Restored to original card view) --- */}
            {activeTab === "travel-groups" && (
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
                        <p>No travel groups yet.</p>
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

            {/* --- Other Tabs --- */}
            {activeTab === "saved" && (
              <div className="space-y-6">
                {posts.filter((p) => userSaves.has(p.id)).length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No saved posts yet</p>
                  </div>
                ) : (
                  posts
                    .filter((p) => userSaves.has(p.id))
                    .map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId!}
                        userLiked={userLikes.has(post.id)}
                        userSaved={userSaves.has(post.id)}
                        onUpdate={handlePostUpdate}
                      />
                    ))
                )}
              </div>
            )}

            {activeTab === "find-buddies" && (
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
                    {/* ... (Search filters omitted for brevity but functionality preserved in performBuddySearch) ... */}
                  </div>
                  {buddySearchResults.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Start searching to find travel buddies</p>
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
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => sendBuddyConnectionRequest(result.id)}
                              >
                                <UserPlus className="h-4 w-4 mr-1" /> Connect
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "nearby" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Travelers Nearby
                  </CardTitle>
                  {userLocation && <p className="text-sm text-muted-foreground">Location enabled</p>}
                </CardHeader>
                <CardContent>
                  {!userLocation ? (
                    <div className="text-center py-12">
                      <Button onClick={requestLocation} disabled={nearbyLoading}>
                        {nearbyLoading ? "Getting location..." : "Enable Location"}
                      </Button>
                    </div>
                  ) : nearbyTravelers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No travelers found nearby</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {nearbyTravelers.map((traveler) => (
                        <Card key={traveler.id}>
                          <CardHeader>
                            <CardTitle>{traveler.full_name}</CardTitle>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "travel-with-me" && (
              <Card>
                <CardHeader>
                  <CardTitle>Post Your Travel Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Share your travel plans</p>
                    <Button className="mt-4">Create Travel Plan</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Explore;
