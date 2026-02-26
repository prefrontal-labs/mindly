"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCertification } from "@/lib/certifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ArrowRight, GraduationCap, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { toast } from "sonner";

const experienceLevels = [
  {
    id: "beginner",
    label: "Beginner",
    description: "New to AI, learning fundamentals and basic concepts",
    icon: "🌱",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Some AI experience, familiar with LLMs and basic applications",
    icon: "🌿",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Working with AI professionally, building production systems",
    icon: "🌳",
  },
];

function GenerateRoadmapContent() {
  const searchParams = useSearchParams();
  const certId = searchParams.get("cert") || "agentic-ai-fundamentals";
  const cert = getCertification(certId);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [existingRoadmapId, setExistingRoadmapId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setChecking(false); return; }
      const { data } = await supabase
        .from("roadmaps").select("id")
        .eq("user_id", user.id).eq("certification_id", certId).maybeSingle();
      if (data) setExistingRoadmapId(data.id);
      setChecking(false);
    }
    check();
  }, [certId, supabase]);

  async function handleGenerate() {
    if (!selectedLevel) {
      toast.error("Please select your experience level");
      return;
    }

    setGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch("/api/ai/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certification: cert?.name || "Agentic AI Fundamentals",
          certificationId: certId,
          experienceLevel: selectedLevel,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate roadmap");

      const { roadmap } = await response.json();

      const { data, error } = await supabase
        .from("roadmaps")
        .insert({
          user_id: user.id,
          certification_id: certId,
          title: `${cert?.name || "AI Course"} - ${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Path`,
          sections: roadmap,
          experience_level: selectedLevel,
        })
        .select()
        .single();

      if (error) throw new Error(error.message || JSON.stringify(error));

      toast.success("Roadmap generated! Let's start learning!");
      router.push(`/roadmap/${data.id}`);
    } catch (err: unknown) {
      console.error("Roadmap generation failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to generate roadmap: ${message}`);
      setGenerating(false);
    }
  }

  if (checking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (existingRoadmapId) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-24">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Roadmap Generator
            </div>
            <h1 className="text-3xl font-bold mb-2">
              You Already Have a <span className="gradient-text">Roadmap</span>
            </h1>
            <p className="text-muted-foreground">
              You&apos;ve already generated a learning path for {cert?.name || "this certification"}.
            </p>
          </div>

          {cert && (
            <Card className="bg-card border-border mb-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cert.color} flex items-center justify-center text-2xl`}>
                    {cert.icon}
                  </div>
                  <div>
                    <CardTitle>{cert.name}</CardTitle>
                    <Badge variant="outline">{cert.code}</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          <Card className="bg-amber-50 border-amber-200 mb-6">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">One roadmap per certification</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Each certification supports one personalized roadmap. View your existing roadmap to continue learning.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => router.push(`/roadmap/${existingRoadmapId}`)}
            className="w-full bg-primary hover:bg-primary/90 py-6 text-lg"
          >
            View My Roadmap
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Roadmap Generator
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Generate Your <span className="gradient-text">Learning Path</span>
          </h1>
          <p className="text-muted-foreground">
            Tell us about your experience and we&apos;ll create a personalized
            roadmap for {cert?.name || "your certification"}.
          </p>
        </div>

        {cert && (
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cert.color} flex items-center justify-center text-2xl`}
                >
                  {cert.icon}
                </div>
                <div>
                  <CardTitle>{cert.name}</CardTitle>
                  <Badge variant="outline">{cert.code}</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            What&apos;s your experience level?
          </h2>
          <div className="grid gap-3">
            {experienceLevels.map((level) => (
              <Card
                key={level.id}
                className={`bg-card border-border cursor-pointer transition-all ${
                  selectedLevel === level.id
                    ? "border-primary ring-1 ring-primary"
                    : "hover:border-primary/30"
                }`}
                onClick={() => setSelectedLevel(level.id)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="text-3xl">{level.icon}</div>
                  <div>
                    <h3 className="font-semibold">{level.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {level.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || !selectedLevel}
          className="w-full bg-primary hover:bg-primary/90 py-6 text-lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              AI is crafting your roadmap...
            </>
          ) : (
            <>
              Generate My Roadmap
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </>
  );
}

export default function GenerateRoadmapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <GenerateRoadmapContent />
    </Suspense>
  );
}
