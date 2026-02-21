"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCertification } from "@/lib/certifications";
import { useDebounce } from "use-debounce";
import Navbar from "@/components/layout/navbar";
import CodeEditor from "@/components/projects/code-editor";
import StepGuide from "@/components/projects/step-guide";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Save,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import type { Roadmap, Project, ProjectSubmission, CodeFeedback } from "@/types";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const roadmapId = params.roadmapId as string;
  const sectionIndex = parseInt(params.sectionIndex as string);
  const difficulty = params.difficulty as "easy" | "medium" | "hard";

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [code, setCode] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState<{ [key: number]: CodeFeedback }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Debounce code for auto-save (3 seconds)
  const [debouncedCode] = useDebounce(code, 3000);

  // Load roadmap and project
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      // Load roadmap
      const { data: roadmapData } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("id", roadmapId)
        .single();

      if (roadmapData && !controller.signal.aborted) {
        setRoadmap(roadmapData);
        const section = roadmapData.sections?.[sectionIndex];

        if (section) {
          await generateProject(section, roadmapData, controller.signal);
        }
      }
    }
    load();
    return () => controller.abort();
  }, [roadmapId, sectionIndex, difficulty]);

  // Auto-save when code changes
  useEffect(() => {
    if (projectId && code && !loading) {
      saveProgress();
    }
  }, [debouncedCode]);

  async function generateProject(section: any, rm: Roadmap, signal?: AbortSignal) {
    setLoading(true);
    try {
      const cert = getCertification(rm.certification_id);
      const res = await fetch("/api/ai/generate-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTitle: section.title,
          topics: section.topics,
          certification: cert?.name || "Agentic AI Fundamentals",
          difficulty,
          roadmapId: rm.id,
          sectionIndex,
        }),
        signal,
      });

      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        setCode(data.project.starter_code);

        // Check if user has existing submission
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try to find existing project in database
          const { data: existingProject } = await supabase
            .from("projects")
            .select("id")
            .eq("roadmap_id", roadmapId)
            .eq("section_index", sectionIndex)
            .eq("difficulty", difficulty)
            .single();

          if (existingProject) {
            setProjectId(existingProject.id);
            // Load existing submission
            const { data: submission } = await supabase
              .from("project_submissions")
              .select("*")
              .eq("user_id", user.id)
              .eq("project_id", existingProject.id)
              .single();

            if (submission) {
              setCode(submission.code || data.project.starter_code);
              setCurrentStep(submission.current_step || 0);
              setFeedback(submission.feedback || {});
            }
          }
        }
      } else {
        toast.error("Failed to generate project");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Failed to load project");
    }
    setLoading(false);
  }

  async function saveProgress(completed = false) {
    if (!projectId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/projects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          code,
          currentStep,
          feedback,
          completed,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!completed) {
          toast.success("Progress saved", { duration: 1500 });
        }
      } else {
        toast.error("Failed to save progress");
      }
    } catch (error) {
      console.error("Save error:", error);
    }
    setSaving(false);
  }

  async function evaluateCode() {
    if (!project) return;

    setEvaluating(true);
    try {
      const step = project.steps[currentStep];
      const res = await fetch("/api/ai/evaluate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          solutionCode: project.solution_code,
          step,
          language: project.language,
        }),
      });

      const data = await res.json();
      if (data.feedback) {
        setFeedback({ ...feedback, [currentStep]: data.feedback });
        toast.success("Feedback received!");
      } else {
        toast.error("Failed to get feedback");
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      toast.error("Failed to evaluate code");
    }
    setEvaluating(false);
  }

  function handleNextStep() {
    if (currentStep < (project?.steps.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
      toast.success("Moving to next step");
    } else {
      saveProgress(true);
      toast.success("Project completed! 🎉");
      router.push(`/learn/${roadmapId}/${sectionIndex}?tab=projects`);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">AI is generating your project...</p>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p>Project not found</p>
        </div>
      </>
    );
  }

  const currentFeedback = feedback[currentStep];

  return (
    <>
      <Navbar />
      <div className="h-screen pt-14 flex flex-col bg-[#f0f9ff]">
        {/* Top bar */}
        <div className="border-b border-border bg-white px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/learn/${roadmapId}/${sectionIndex}?tab=projects`)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-bold">{project.title}</h1>
                <p className="text-xs text-muted-foreground">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className={`
                  ${difficulty === "easy" ? "bg-emerald-100 text-emerald-700" : ""}
                  ${difficulty === "medium" ? "bg-amber-100 text-amber-700" : ""}
                  ${difficulty === "hard" ? "bg-red-100 text-red-700" : ""}
                `}
              >
                {difficulty.toUpperCase()}
              </Badge>
              {saving ? (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Save className="h-3 w-3" />
                  Saved
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Split screen workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Step Guide */}
          <div className="w-1/3 border-r border-border bg-white overflow-hidden">
            <StepGuide
              steps={project.steps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </div>

          {/* Right: Code Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                code={code}
                language={project.language}
                onChange={setCode}
              />
            </div>

            {/* Feedback panel */}
            {currentFeedback && (
              <div className="p-4 border-t border-border bg-white max-h-48 overflow-y-auto">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">AI Feedback</h3>
                        <p className="text-sm">{currentFeedback.overall}</p>
                        {currentFeedback.score !== undefined && (
                          <Badge className="mt-2 bg-primary">
                            Score: {currentFeedback.score}/100
                          </Badge>
                        )}
                      </div>
                    </div>
                    {currentFeedback.suggestions.length > 0 && (
                      <div className="mt-3 text-sm">
                        <p className="font-medium mb-1">Suggestions:</p>
                        <ul className="space-y-1">
                          {currentFeedback.suggestions.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span>•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bottom actions */}
            <div className="p-4 border-t border-border bg-white shrink-0 flex gap-3">
              <Button
                onClick={evaluateCode}
                disabled={evaluating || !code}
                variant="outline"
                className="flex-1"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Feedback
                  </>
                )}
              </Button>
              <Button
                onClick={handleNextStep}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {currentStep < project.steps.length - 1 ? (
                  <>
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Complete Project
                    <Trophy className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
