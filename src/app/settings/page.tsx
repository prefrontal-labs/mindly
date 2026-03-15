"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/navbar";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
          email: data.user.email || "",
        });
      }
    });
  }, []);

  async function handleResetProgress() {
    setResetting(true);
    try {
      const res = await fetch("/api/user/reset-progress", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Progress reset. Your roadmaps are still intact.");
      setResetOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset progress");
    } finally {
      setResetting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete-account", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm mb-8">Manage your account preferences</p>

        {/* Account info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Reset Progress */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">Reset Progress</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clears all quiz attempts, section progress, and badges. Your roadmaps are kept.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-amber-500 text-amber-600 hover:bg-amber-50"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div>
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently deletes your account and all data. This cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0"
                onClick={() => { setDeleteConfirm(""); setDeleteOpen(true); }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Reset Progress Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Reset all progress?</DialogTitle>
            <DialogDescription>
              This will permanently delete your quiz attempts, section progress, badges, and cached AI content.
              Your roadmaps will remain. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button
              onClick={handleResetProgress}
              disabled={resetting}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, reset progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, all roadmaps, progress, and data.
              There is no way back. Type <strong className="text-foreground">DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm !== "DELETE"}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
