import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MapPin, Calendar, MoreVertical, MessageSquare, Map } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
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
  currentUserId: string;
}

export const GroupChat = ({
  groupId,
  groupTitle,
  fromLocation,
  toLocation,
  travelDate,
  open,
  onOpenChange,
  currentUserId,
}: GroupChatProps) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
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

  useEffect(() => {
    if (!open) return;

    const fetchMessages = async () => {
      const { data, error } = await (supabase as any)
        .from("travel_group_messages")
        .select(`*, profiles:user_id(full_name, avatar_url)`)
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching group messages:", error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Only listening for inserts now since delete is removed
          schema: "public",
          table: "travel_group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();
          const newMsg = { ...payload.new, profiles: profile } as GroupMessage;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, open]);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Optimistic clear

    const { error } = await (supabase as any).from("travel_group_messages").insert({
      group_id: groupId,
      user_id: currentUserId,
      content: messageContent,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      setNewMessage(messageContent); // Restore text on fail
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-xl">
        {/* --- Header --- */}
        <div className="border-b px-4 py-3 bg-muted/40 flex items-center justify-between shrink-0 gap-2">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold leading-none truncate">{groupTitle}</DialogTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 truncate">
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-3 w-3 shrink-0" /> {fromLocation} to {toLocation}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-0.5 shrink-0">
                <Calendar className="h-3 w-3 shrink-0" /> {format(new Date(travelDate), "MMM d")}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 px-2">
              <Map className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Plan Trip</span>
              <span className="xs:hidden">Plan</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Group Info</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Leave Group</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* --- Chat Area --- */}
        <div className="flex-1 overflow-hidden relative bg-background" ref={scrollAreaRef}>
          <ScrollArea className="h-full px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-10">
                <MessageSquare className="h-10 w-10 mb-2" />
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.user_id === currentUserId;
                const messageDate = new Date(msg.created_at);
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const prevDate = prevMessage ? new Date(prevMessage.created_at) : null;
                const showDateSeparator = !prevDate || messageDate.getDate() !== prevDate.getDate();

                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <span className="bg-muted text-muted-foreground text-[10px] px-2 py-1 rounded-full">
                          {getDateLabel(msg.created_at)}
                        </span>
                      </div>
                    )}

                    <div className={`flex gap-2 mb-3 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(msg.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`flex flex-col max-w-[75%] group ${isMe ? "items-end" : "items-start"}`}>
                        {!isMe && (
                          <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">
                            {msg.profiles?.full_name || "Unknown"}
                          </span>
                        )}

                        <div
                          className={`relative px-3 py-2 text-sm shadow-sm
                            ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                                : "bg-secondary text-secondary-foreground rounded-2xl rounded-tl-none"
                            }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-snug">{msg.content}</p>

                          <div
                            className={`flex items-center justify-end gap-1 mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            <span className="text-[10px]">{format(messageDate, "h:mm a")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </div>

        {/* --- Input Area --- */}
        <div className="p-3 border-t bg-background shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 items-end"
          >
            <Input
              placeholder="Message group..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="rounded-full min-h-[44px] py-3"
            />
            <Button type="submit" size="icon" className="rounded-full h-11 w-11 shrink-0" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5 ml-0.5" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
