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
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

// ... [Keep all your existing Interfaces: Post, Profile, Connection, Message, etc.] ...
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

// ... [Keep MESSAGE_THEMES and Schemas] ...
const MESSAGE_THEMES = [
  {
    id: "default",
    name: "Default",
    primary: "bg-primary",
    secondary: "bg-muted",
  },
  {
    id: "ocean",
    name: "Ocean",
    primary: "bg-blue-500",
    secondary: "bg-blue-100",
  },
  {
    id: "forest",
    name: "Forest",
    primary: "bg-green-600",
    secondary: "bg-green-100",
  },
  {
    id: "sunset",
    name: "Sunset",
    primary: "bg-orange-500",
    secondary: "bg-orange-100",
  },
  {
    id: "purple",
    name: "Purple",
    primary: "bg-purple-600",
    secondary: "bg-purple-100",
  },
  {
    id: "rose",
    name: "Rose",
    primary: "bg-pink-500",
    secondary: "bg-pink-100",
  },
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

  // NEW: State for YouTube-style sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [messageTheme, setMessageTheme] = useState("default");
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

  // ... [Keep all your existing helper functions: loadTravelGroups, loadPosts, loadConnections, etc.] ...
  // (I am omitting the body of these functions to save space, assuming they remain unchanged as requested)
  const loadTravelGroups = async () => {
    /* ... existing code ... */ setTravelGroups([]);
  };
  const loadUserGroupMemberships = async (userId: string) => {
    /* ... existing code ... */
  };
  const handleGroupUpdate = () => {
    /* ... existing code ... */
  };
  const performBuddySearch = async () => {
    /* ... existing code ... */ setBuddySearchLoading(false);
  };
  const sendBuddyConnectionRequest = async (targetUserId: string) => {
    /* ... existing code ... */
  };
  const requestLocation = async () => {
    /* ... existing code ... */
  };
  const loadNearbyTravelers = async (lat: number, lng: number) => {
    /* ... existing code ... */
  };
  const loadPosts = async () => {
    /* ... existing code ... */ setPosts([]);
  };
  const loadUserInteractions = async (userId: string) => {
    /* ... existing code ... */
  };
  const handlePostUpdate = () => {
    /* ... existing code ... */
  };
  const loadConnections = async (userId: string) => {
    /* ... existing code ... */
  };
  const acceptConnection = async (connectionId: string) => {
    /* ... existing code ... */
  };
  const rejectConnection = async (connectionId: string) => {
    /* ... existing code ... */
  };
  const removeConnection = async (connectionId: string) => {
    /* ... existing code ... */
  };
  const loadAllUsers = async () => {
    /* ... existing code ... */
  };
  const loadConversations = async () => {
    /* ... existing code ... */
  };
  const loadMessages = async () => {
    /* ... existing code ... */
  };

  useEffect(() => {
    if (selectedUser) loadMessages();
  }, [selectedUser]);

  const sendMessage = async () => {
    /* ... existing code ... */
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

  useEffect(() => {
    if (!currentUserId) return;
    const postsChannel = supabase
      .channel("posts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadPosts())
      .subscribe();
    // ... [Rest of realtime logic]
    return () => {
      supabase.removeChannel(postsChannel);
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
    {
      id: "feed" as const,
      label: "Tramigos",
      icon: Rss,
    },
    {
      id: "messages" as const,
      label: "Messages",
      icon: MessageSquare,
    },
    {
      id: "travel-groups" as const,
      label: "Travel Groups",
      icon: Plane,
    },
    {
      id: "find-buddies" as const,
      label: "Find Tramigos",
      icon: Search,
    },
    {
      id: "nearby" as const,
      label: "Nearby",
      icon: MapPin,
    },
    {
      id: "travel-with-me" as const,
      label: "Travel With Me",
      icon: UserPlus,
    },
    {
      id: "connections" as const,
      label: "Connections",
      icon: Users,
      badge: pendingReceived.length,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      {/* NEW LAYOUT STRUCTURE 
        Sidebar is fixed left. Main content has left margin.
      */}

      <div className="flex pt-20">
        {" "}
        {/* Offset for DashboardNav which is usually fixed/sticky */}
        {/* YOUTUBE-STYLE SIDEBAR */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur-sm border-r z-40 transition-all duration-200 ease-in-out
            ${isSidebarOpen ? "w-60" : "w-[72px]"}
          `}
        >
          {/* Sidebar Toggle Button (Placed here since we can't edit DashboardNav) */}
          <div className={`flex items-center h-12 px-3 mb-2 ${isSidebarOpen ? "justify-end" : "justify-center"}`}>
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
                    flex items-center transition-all duration-200 rounded-lg group
                    ${
                      isSidebarOpen
                        ? "w-full px-3 py-2 gap-4 flex-row justify-start" // Open: Row layout
                        : "w-full py-4 gap-1 flex-col justify-center" // Closed: Column layout (Mini)
                    }
                    ${
                      activeTab === tabItem.id
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }
                  `}
                  title={!isSidebarOpen ? tabItem.label : undefined}
                >
                  {/* Icon */}
                  <Icon
                    className={`
                    shrink-0 transition-all
                    ${isSidebarOpen ? "h-5 w-5" : "h-6 w-6"} 
                  `}
                  />

                  {/* Text Label */}
                  <span
                    className={`
                    truncate font-medium transition-all
                    ${isSidebarOpen ? "text-sm" : "text-[10px]"}
                  `}
                  >
                    {tabItem.label}
                  </span>

                  {/* Badge */}
                  {tabItem.badge && tabItem.badge > 0 && (
                    <span
                      className={`
                        bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-bold
                        ${
                          isSidebarOpen
                            ? "ml-auto h-5 w-5"
                            : "absolute top-2 right-2 h-4 w-4 text-[10px] ring-2 ring-background" // Float badge in mini mode
                        }
                      `}
                    >
                      {tabItem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
        {/* MAIN CONTENT AREA */}
        {/* Margin left adjusts based on sidebar state */}
        <div
          className={`flex-1 min-w-0 transition-all duration-200 ease-in-out px-4 py-6
          ${isSidebarOpen ? "ml-60" : "ml-[72px]"}
        `}
        >
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Tramigos</h1>
              <CreatePostDialog onPostCreated={handlePostUpdate} />
            </div>

            {/* --- Existing Content Logic --- */}
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
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message
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

                {/* Pending Requests */}
                {pendingReceived.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">Pending Requests</h3>
                    <div className="grid gap-4">
                      {pendingReceived.map((request) => (
                        <Card key={request.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div
                              className="flex items-center gap-4 cursor-pointer"
                              onClick={() => navigate(`/profile/${request.requester?.id}`)}
                            >
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={request.requester?.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(request.requester?.full_name || null)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold hover:underline">
                                  {request.requester?.full_name || "User"}
                                </h3>
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
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
                <Card className="md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" /> Conversations
                    </CardTitle>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      {searchQuery ? (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 border-b ${selectedUser?.id === user.id ? "bg-muted" : ""}`}
                            onClick={() => {
                              setSelectedUser(user);
                              setSearchQuery("");
                            }}
                          >
                            <Avatar>
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{user.full_name || "User"}</p>
                              <p className="text-sm text-muted-foreground">Start a conversation</p>
                            </div>
                          </div>
                        ))
                      ) : conversations.length > 0 ? (
                        conversations.map((convo) => (
                          <div
                            key={convo.user.id}
                            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 border-b ${selectedUser?.id === convo.user.id ? "bg-muted" : ""}`}
                            onClick={() => setSelectedUser(convo.user)}
                          >
                            <Avatar>
                              <AvatarImage src={convo.user.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(convo.user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{convo.user.full_name || "User"}</p>
                                {convo.unreadCount > 0 && (
                                  <span className="bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {convo.unreadCount}
                                  </span>
                                )}
                              </div>
                              {convo.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate">{convo.lastMessage.content}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 px-4">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">No conversations yet</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 flex flex-col">
                  {selectedUser ? (
                    <>
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
                            {showThemePicker && (
                              <div className="absolute right-0 top-full mt-2 bg-card border rounded-lg shadow-lg p-2 z-10">
                                <p className="text-xs text-muted-foreground mb-2 px-2">Chat Theme</p>
                                <div className="flex gap-1">
                                  {MESSAGE_THEMES.map((theme) => (
                                    <button
                                      key={theme.id}
                                      onClick={() => {
                                        setMessageTheme(theme.id);
                                        setShowThemePicker(false);
                                      }}
                                      className={`w-8 h-8 rounded-full ${theme.primary} ${messageTheme === theme.id ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                                      title={theme.name}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-[300px] p-4">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`mb-4 flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${msg.sender_id === currentUserId ? `${currentTheme.primary} text-white` : currentTheme.secondary}`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs mt-1 opacity-70">{format(new Date(msg.created_at), "h:mm a")}</p>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          />
                          <Button onClick={sendMessage} disabled={!messageText.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <CardContent className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg text-muted-foreground">Select a conversation</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}

            {/* Saved Tab */}
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

            {/* Find Buddies Tab */}
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
                            {result.bio && <p className="text-sm text-muted-foreground line-clamp-2">{result.bio}</p>}
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
                                      setSelectedUser({
                                        id: result.id,
                                        full_name: result.full_name,
                                        avatar_url: result.avatar_url,
                                      });
                                      setActiveTab("messages");
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
            {activeTab === "nearby" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Travelers Nearby
                  </CardTitle>
                  {userLocation && (
                    <p className="text-sm text-muted-foreground">Location enabled • Showing travelers in your area</p>
                  )}
                </CardHeader>
                <CardContent>
                  {!userLocation ? (
                    <div className="text-center py-12">
                      <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Enable Location</h3>
                      <p className="text-muted-foreground mb-4">Allow location access to find travelers near you</p>
                      {locationError && <p className="text-sm text-destructive mb-4">{locationError}</p>}
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
                                      setSelectedUser({
                                        id: traveler.id,
                                        full_name: traveler.full_name,
                                        avatar_url: traveler.avatar_url,
                                      });
                                      handleTabChange("messages");
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
            {activeTab === "travel-with-me" && (
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
    </div>
  );
};

export default Explore;
