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

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Onboarding answers
  const [role, setRole] = useState<"student" | "professional" | "">("");
  const [programmingLevel, setProgrammingLevel] = useState(0);
  const [aiExperience, setAiExperience] = useState<"none" | "beginner" | "intermediate" | "advanced" | "">("");
  const [learningGoal, setLearningGoal] = useState<"career-switch" | "skill-upgrade" | "projects" | "certification" | "">("");
  const [timeCommitment, setTimeCommitment] = useState<"1-2" | "3-5" | "5-10" | "10+" | "">("");

  const router = useRouter();
  const supabase = createClient();

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
      toast.success("Account created! Check your email to confirm.");
      router.push("/dashboard");
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
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Continue
              </Button>
            </form>
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
