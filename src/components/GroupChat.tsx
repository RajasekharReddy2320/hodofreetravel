import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Plane, Shield } from "lucide-react";
import { GroupTripPlanner } from "./GroupTripPlanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, isSameDay } from "date-fns";

interface Message {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
  user_id: string;
}

interface GroupChatProps {
  groupId: string;
  groupTitle: string;
  fromLocation: string;
  toLocation: string;
  travelDate: string;
  travelMode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GroupChat = ({
  groupId,
  groupTitle,
  fromLocation,
  toLocation,
  travelDate,
  travelMode,
  open,
  onOpenChange,
}: GroupChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadMessages();
      getCurrentUser();
      subscribeToMessages();
    }
  }, [open, groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("group_messages")
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        profiles:user_id (full_name, avatar_url)
      `,
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data as any);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => loadMessages(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("group_messages").insert({
        group_id: groupId,
        user_id: currentUserId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{groupTitle} - Group Chat</DialogTitle>
              <Button variant="outline" size="sm" onClick={() => setPlannerOpen(true)} className="gap-2">
                <Plane className="h-4 w-4" />
                Plan Trip
              </Button>
            </div>
          </DialogHeader>

          {/* White background with grey message bubbles */}
          <ScrollArea className="flex-1 px-4 bg-background" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((message, index) => {
                  const isOwnMessage = message.user_id === currentUserId;
                  const messageDate = new Date(message.created_at);
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const prevDate = prevMessage ? new Date(prevMessage.created_at) : null;
                  const showDateSeparator = !prevDate || !isSameDay(messageDate, prevDate);

                  return (
                    <div key={message.id}>
                      {showDateSeparator && (
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                            {getDateLabel(messageDate)}
                          </div>
                        </div>
                      )}
                      <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                        <Avatar className="h-8 w-8 border-2 border-muted">
                          <AvatarImage src={message.profiles.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                            {getInitials(message.profiles.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "justify-end" : ""}`}>
                            <span
                              className="text-sm font-medium text-foreground"
                              style={{ fontFamily: "'Outfit', 'Poppins', sans-serif" }}
                            >
                              {isOwnMessage ? "You" : message.profiles.full_name || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">{format(messageDate, "HH:mm")}</span>
                          </div>
                          <div
                            className={`inline-block p-3 rounded-2xl max-w-[80%] ${
                              isOwnMessage
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted text-foreground rounded-tl-sm"
                            }`}
                          >
                            <p
                              className="text-sm whitespace-pre-wrap break-words"
                              style={{ fontFamily: "'Outfit', 'Poppins', sans-serif" }}
                            >
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="flex gap-2 p-4 border-t bg-background">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
              style={{ fontFamily: "'Outfit', 'Poppins', sans-serif" }}
            />
            <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <GroupTripPlanner
        groupId={groupId}
        groupTitle={groupTitle}
        fromLocation={fromLocation}
        toLocation={toLocation}
        travelDate={travelDate}
        travelMode={travelMode}
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
      />
    </>
  );
};
