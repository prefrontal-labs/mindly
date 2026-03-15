"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Briefcase, GraduationCap, Code, Target, Clock, User, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [institute, setInstitute] = useState("");
  const [role, setRole] = useState<"student" | "professional" | "">("");
  const [programmingLevel, setProgrammingLevel] = useState(0);
  const [aiExperience, setAiExperience] = useState<"none" | "beginner" | "intermediate" | "advanced" | "">("");
  const [learningGoal, setLearningGoal] = useState<"career-switch" | "skill-upgrade" | "projects" | "certification" | "">("");
  const [timeCommitment, setTimeCommitment] = useState<"1-2" | "3-5" | "5-10" | "10+" | "">("");

  useEffect(() => {
    // If already onboarded (has role), skip to dashboard
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      if (user.user_metadata?.role) { router.push("/dashboard"); return; }
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Update auth metadata
      const { data: { user }, error } = await supabase.auth.updateUser({
        data: {
          institute,
          role,
          programming_level: programmingLevel,
          ai_experience: aiExperience,
          learning_goal: learningGoal,
          time_commitment: timeCommitment,
        },
      });
      if (error) throw error;

      // Sync to profiles table (Google OAuth users — trigger only fires at signup, not on updateUser)
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            institute,
            role,
            programming_level: programmingLevel,
            ai_experience: aiExperience,
            learning_goal: learningGoal,
            time_commitment: timeCommitment,
          })
          .eq("id", user.id);
        if (profileError) throw profileError;
      }

      toast.success("Profile saved! Welcome to Mindly.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg bg-card border-border">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">Mindly</span>
          </Link>
          <CardTitle className="text-2xl">Tell us about yourself</CardTitle>
          <p className="text-muted-foreground text-sm">Help us personalize your learning experience</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Institute */}
            <div className="space-y-2">
              <Label htmlFor="institute" className="flex items-center gap-2"><Building2 className="h-4 w-4" />Institute / Company</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="institute"
                  type="text"
                  placeholder="MIT, Google, Self-employed..."
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Question 1: Role */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><User className="h-4 w-4" />I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "student", label: "Student", icon: GraduationCap },
                  { value: "professional", label: "Professional", icon: Briefcase },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value as typeof role)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      role === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <option.icon className="h-5 w-5 mb-2" />
                    <div className="font-medium text-sm">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Programming Level */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><Code className="h-4 w-4" />Programming fluency</Label>
              <div className="flex justify-between items-center gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setProgrammingLevel(level)}
                    className={`h-12 w-12 rounded-lg border-2 transition-all flex items-center justify-center font-bold ${
                      programmingLevel >= level
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-border hover:border-amber-300"
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {programmingLevel === 0 && "Select your level"}
                {programmingLevel === 1 && "Beginner - Just starting"}
                {programmingLevel === 2 && "Basic - Can write simple scripts"}
                {programmingLevel === 3 && "Intermediate - Comfortable with code"}
                {programmingLevel === 4 && "Advanced - Professional developer"}
                {programmingLevel === 5 && "Expert - Years of experience"}
              </p>
            </div>

            {/* Question 3: AI Experience */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><Sparkles className="h-4 w-4" />AI/LLM experience</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "none", label: "None" },
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAiExperience(option.value as typeof aiExperience)}
                    className={`p-3 rounded-lg border-2 transition-all text-center text-sm font-medium ${
                      aiExperience === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 4: Learning Goal */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><Target className="h-4 w-4" />Main learning goal</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "career-switch", label: "Career Switch" },
                  { value: "skill-upgrade", label: "Skill Upgrade" },
                  { value: "projects", label: "Build Projects" },
                  { value: "certification", label: "Get Certified" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLearningGoal(option.value as typeof learningGoal)}
                    className={`p-3 rounded-lg border-2 transition-all text-center text-sm font-medium ${
                      learningGoal === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 5: Time Commitment */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><Clock className="h-4 w-4" />Weekly study time (hours)</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "1-2", label: "1-2 hours" },
                  { value: "3-5", label: "3-5 hours" },
                  { value: "5-10", label: "5-10 hours" },
                  { value: "10+", label: "10+ hours" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTimeCommitment(option.value as typeof timeCommitment)}
                    className={`p-3 rounded-lg border-2 transition-all text-center text-sm font-medium ${
                      timeCommitment === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading || !role || programmingLevel === 0 || !aiExperience || !learningGoal || !timeCommitment}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get started →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
