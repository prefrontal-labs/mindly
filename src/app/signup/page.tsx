"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Mail, Lock, User, Loader2, Briefcase, GraduationCap, Code, Target, Clock } from "lucide-react";
import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Onboarding answers
  const [role, setRole] = useState<"student" | "professional" | "">("");
  const [programmingLevel, setProgrammingLevel] = useState(0);
  const [aiExperience, setAiExperience] = useState<"none" | "beginner" | "intermediate" | "advanced" | "">("");
  const [learningGoal, setLearningGoal] = useState<"career-switch" | "skill-upgrade" | "projects" | "certification" | "">("");
  const [timeCommitment, setTimeCommitment] = useState<"1-2" | "3-5" | "5-10" | "10+" | "">("");

  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleBasicInfo(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
            programming_level: programmingLevel,
            ai_experience: aiExperience,
            learning_goal: learningGoal,
            time_commitment: timeCommitment,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Profile is automatically created by database trigger with all metadata
      // Don't redirect to dashboard — user must confirm email first
      router.push("/login?message=check-email");
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Failed to create account. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg bg-card border-border">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">Mindly</span>
          </Link>
          <CardTitle className="text-2xl">
            {step === 1 ? "Create your account" : "Tell us about yourself"}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {step === 1 ? "Start your AI learning journey" : `Step ${step} of 2 - Help us personalize your learning`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Google OAuth */}
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

            <form onSubmit={handleBasicInfo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={googleLoading}>
                Continue
              </Button>
            </form>
            </div>
          ) : (
            <form onSubmit={handleOnboarding} className="space-y-5">
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
                        role === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
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
                        aiExperience === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
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
                        learningGoal === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
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
                        timeCommitment === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={loading || !role || programmingLevel === 0 || !aiExperience || !learningGoal || !timeCommitment}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </div>
            </form>
          )}

          {step === 1 && (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
