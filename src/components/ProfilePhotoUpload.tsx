import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Camera, ZoomIn, ZoomOut, RotateCw, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfilePhotoUploadProps {
  currentAvatarUrl: string | null;
  userId: string;
  fullName: string | null;
  onPhotoUpdated: (newUrl: string) => void;
}

const ProfilePhotoUpload = ({
  currentAvatarUrl,
  userId,
  fullName,
  onPhotoUpdated,
}: ProfilePhotoUploadProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setZoom([1]);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!previewUrl) {
        reject(new Error("No image selected"));
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 400; // Output size
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Clear canvas
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        // Apply transformations
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom[0], zoom[0]);

        // Calculate dimensions to cover the square
        const aspectRatio = img.width / img.height;
        let drawWidth, drawHeight;
        if (aspectRatio > 1) {
          drawHeight = size;
          drawWidth = size * aspectRatio;
        } else {
          drawWidth = size;
          drawHeight = size / aspectRatio;
        }

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not create blob"));
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = previewUrl;
    });
  }, [previewUrl, zoom, rotation]);

  const handleUpload = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    try {
      const blob = await processImage();
      const fileName = `${userId}/avatar-${Date.now()}.jpg`;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split("/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      // Upload new avatar
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(uploadData.path);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      onPhotoUpdated(urlData.publicUrl);
      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully",
      });
      handleClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setZoom([1]);
    setRotation(0);
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
      >
        <Camera className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {!previewUrl ? (
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={currentAvatarUrl || undefined} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative mx-auto w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 bg-muted">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${zoom[0]}) rotate(${rotation}deg)`,
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  {/* Zoom */}
                  <div className="flex items-center gap-3">
                    <ZoomOut className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={zoom}
                      onValueChange={setZoom}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Rotate */}
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={rotateImage}>
                      <RotateCw className="h-4 w-4 mr-1" />
                      Rotate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            {previewUrl && (
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Save Photo"}
              </Button>
            )}
          </DialogFooter>
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePhotoUpload;
