import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  Share2,
  Users
} from "lucide-react";

interface SharePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent: string;
  postAuthor: string;
}

interface Conversation {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const SharePostDialog = ({ 
  open, 
  onOpenChange, 
  postId, 
  postContent,
  postAuthor 
}: SharePostDialogProps) => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const postUrl = `${window.location.origin}/post/${postId}`;
  const shareText = `Check out this post by ${postAuthor}: "${postContent.slice(0, 100)}${postContent.length > 100 ? '...' : ''}"`;

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open]);

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get connected users
    const { data: connections } = await supabase
      .from("user_connections")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (connections) {
      const userIds = connections.map(c => 
        c.requester_id === user.id ? c.addressee_id : c.requester_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profiles) {
        setConversations(profiles.map(p => ({ user: p })));
      }
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const sendToChat = async (userId: string) => {
    if (!currentUserId) return;
    setSendingTo(userId);
    setLoading(true);

    try {
      const message = `📢 Shared a post with you!\n\n"${postContent.slice(0, 200)}${postContent.length > 200 ? '...' : ''}"\n\n🔗 View post: ${postUrl}`;
      
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        recipient_id: userId,
        content: message,
      });

      if (error) throw error;

      toast({ title: "Sent!", description: "Post shared to chat successfully" });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setSendingTo(null);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    setCopiedLink(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${postAuthor}`,
          text: shareText,
          url: postUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      copyLink();
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + postUrl)}`;
    window.open(url, '_blank');
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareViaTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Check out this post from ${postAuthor}`;
    const body = `${shareText}\n\n${postUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const shareViaInstagram = () => {
    // Instagram doesn't have a direct share URL, copy link instead
    copyLink();
    toast({ 
      title: "Link Copied!", 
      description: "Paste it in your Instagram DM or Story" 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Post
          </DialogTitle>
          <DialogDescription>
            Share this post with friends or on social media
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="internal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              In-App
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              External
            </TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="space-y-4">
            <Label className="text-sm text-muted-foreground">Send to a connection</Label>
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No connections yet</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <div 
                      key={conv.user.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.user.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(conv.user.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{conv.user.full_name || "User"}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendToChat(conv.user.id)}
                        disabled={loading && sendingTo === conv.user.id}
                      >
                        {sendingTo === conv.user.id ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="external" className="space-y-4">
            {/* Copy Link */}
            <div className="flex gap-2">
              <Input value={postUrl} readOnly className="flex-1 text-sm" />
              <Button variant="outline" onClick={copyLink}>
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Native Share (Mobile) */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <Button className="w-full" onClick={shareNative}>
                <Share2 className="mr-2 h-4 w-4" />
                Share via...
              </Button>
            )}

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30"
                onClick={shareViaWhatsApp}
              >
                <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" />
                WhatsApp
              </Button>
              <Button 
                variant="outline"
                className="bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border-[#0088cc]/30"
                onClick={shareViaTelegram}
              >
                <Send className="mr-2 h-4 w-4 text-[#0088cc]" />
                Telegram
              </Button>
              <Button 
                variant="outline"
                className="bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border-[#1877F2]/30"
                onClick={shareViaFacebook}
              >
                <Share2 className="mr-2 h-4 w-4 text-[#1877F2]" />
                Facebook
              </Button>
              <Button 
                variant="outline"
                className="bg-gradient-to-r from-[#E1306C]/10 to-[#F77737]/10 hover:from-[#E1306C]/20 hover:to-[#F77737]/20"
                onClick={shareViaInstagram}
              >
                <Share2 className="mr-2 h-4 w-4 text-[#E1306C]" />
                Instagram
              </Button>
            </div>

            <Button variant="outline" className="w-full" onClick={shareViaEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};