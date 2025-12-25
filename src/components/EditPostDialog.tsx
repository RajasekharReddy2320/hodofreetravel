import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, MapPin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string;
    image_url: string | null;
    itinerary?: any;
  };
  onPostUpdated: () => void;
}

export const EditPostDialog = ({ open, onOpenChange, post, onPostUpdated }: EditPostDialogProps) => {
  const [content, setContent] = useState(post.content);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(post.image_url || "");
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [itineraryAction, setItineraryAction] = useState<"keep" | "remove">("keep");
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image too large", description: "Please select an image under 5MB", variant: "destructive" });
        return;
      }
      setImageFile(file);
      setRemoveCurrentImage(false);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setRemoveCurrentImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = post.image_url;

      // Upload new image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      } else if (removeCurrentImage) {
        imageUrl = null;
      }

      // Handle itinerary
      let itineraryData = post.itinerary;
      if (itineraryAction === "remove") {
        itineraryData = null;
      }

      const { error } = await supabase
        .from("posts")
        .update({
          content: content.trim(),
          image_url: imageUrl,
          itinerary: itineraryData,
          updated_at: new Date().toISOString()
        })
        .eq("id", post.id);

      if (error) throw error;

      toast({ title: "Post updated successfully!" });
      onOpenChange(false);
      onPostUpdated();
    } catch (error: any) {
      toast({
        title: "Error updating post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-content">Content</Label>
            <Textarea
              id="edit-content"
              placeholder="Share your travel experiences..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-image" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Image
            </Label>
            <input
              id="edit-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('edit-image')?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {imagePreview ? "Change Image" : "Add Image"}
            </Button>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Itinerary/Trip Plan Section */}
          {post.itinerary && (
            <div className="space-y-3 border-t pt-4">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {post.itinerary.isFromSavedPlan ? "Shared Trip Plan" : "Travel Itinerary"}
              </Label>
              
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{post.itinerary.destination}</span>
                  <Badge variant="secondary" className="text-xs">
                    {post.itinerary.isFromSavedPlan ? "Full Plan" : "Itinerary"}
                  </Badge>
                </div>
                
                <RadioGroup value={itineraryAction} onValueChange={(v) => setItineraryAction(v as "keep" | "remove")} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="keep" id="keep" />
                    <Label htmlFor="keep" className="text-sm cursor-pointer">Keep this {post.itinerary.isFromSavedPlan ? "trip plan" : "itinerary"}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remove" id="remove" />
                    <Label htmlFor="remove" className="text-sm cursor-pointer text-destructive flex items-center gap-1">
                      <Trash2 className="h-3 w-3" />
                      Remove from post
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
