import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { clearE2EKeys } from "@/utils/e2eEncryption";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteAccountDialogProps {
  userEmail: string;
}

const DeleteAccountDialog = ({ userEmail }: DeleteAccountDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<"warning" | "confirm">("warning");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Clear local storage and E2E keys
      clearE2EKeys();
      localStorage.clear();

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted. We're sorry to see you go.",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setStep("warning");
      setConfirmText("");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {step === "warning" ? (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription className="mt-1">
                    This action is permanent and cannot be undone.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            
            <div className="my-4 space-y-3 text-sm">
              <p className="text-muted-foreground">
                Deleting your account will permanently remove:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  Your profile and all personal information
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  All your posts, trips, and travel groups
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  Your messages and connections
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  Booking history and tickets
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  Photo vault and secure documents
                </li>
              </ul>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button 
                variant="destructive" 
                onClick={() => setStep("confirm")}
              >
                I understand, continue
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Final confirmation
              </AlertDialogTitle>
              <AlertDialogDescription>
                To confirm deletion, type <strong>DELETE</strong> below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="my-4 space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                Account: <span className="font-medium text-foreground">{userEmail}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="font-mono"
                  disabled={isDeleting}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete my account"
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
