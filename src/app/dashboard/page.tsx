"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { certifications, getCertification } from "@/lib/certifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  BookOpen,
  Trophy,
  Target,
  Sparkles,
  MessageSquare,
  Layers,
  Loader2,
  PlayCircle,
  Flame,
  CheckCircle,
} from "lucide-react";
import type { Roadmap, SectionProgress, QuizAttempt } from "@/types";

export default function DashboardPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [progressData, setProgressData] = useState<SectionProgress[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner");

      const [roadmapRes, progressRes, quizRes] = await Promise.all([
        supabase.from("roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("section_progress").select("*").eq("user_id", user.id),
        supabase.from("quiz_attempts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (roadmapRes.data) setRoadmaps(roadmapRes.data);
      if (progressRes.data) setProgressData(progressRes.data);
      if (quizRes.data) setQuizAttempts(quizRes.data);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedSections = progressData.filter((p) => p.status === "completed").length;
  const avgQuizScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((acc, q) => acc + q.score, 0) / quizAttempts.length)
    : 0;

  // Find the most recent active roadmap
  const activeRoadmap = roadmaps.find((r) => {
    const completed = progressData.filter((p) => p.roadmap_id === r.id && p.status === "completed").length;
    return completed < (r.sections?.length || 0);
  });

  function getRoadmapProgress(roadmap: Roadmap) {
    const total = roadmap.sections?.length || 0;
    const completed = progressData.filter((p) => p.roadmap_id === roadmap.id && p.status === "completed").length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }

  function getNextSection(roadmap: Roadmap): number {
    const sectionCount = roadmap.sections?.length || 0;
    for (let i = 0; i < sectionCount; i++) {
      const p = progressData.find((pr) => pr.roadmap_id === roadmap.id && pr.section_index === i);
      if (!p || p.status !== "completed") return i;
    }
    return 0;
  }

  const stats = [
    { icon: BookOpen, label: "Lessons Done", value: completedSections, color: "bg-indigo-50 text-indigo-600" },
    { icon: Target, label: "Quizzes Taken", value: quizAttempts.length, color: "bg-emerald-50 text-emerald-600" },
    { icon: Flame, label: "Avg Score", value: `${avgQuizScore}%`, color: "bg-amber-50 text-amber-600" },
    { icon: Layers, label: "Active Paths", value: roadmaps.length, color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Welcome */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Hey, <span className="gradient-text">{userName}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {completedSections > 0
              ? `You've completed ${completedSections} lesson${completedSections > 1 ? "s" : ""}. Keep going!`
              : "Start your first certification path below."}
          </p>
        </div>
        <Button onClick={() => router.push("/interview")} variant="outline" className="hidden sm:flex">
          <MessageSquare className="h-4 w-4 mr-2" />
          Mock Interview
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continue Learning - featured card */}
      {activeRoadmap && (() => {
        const prog = getRoadmapProgress(activeRoadmap);
        const cert = getCertification(activeRoadmap.certification_id);
        const nextIdx = getNextSection(activeRoadmap);
        const nextSection = activeRoadmap.sections?.[nextIdx];
        return (
          <Card className="border-border mb-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className={`w-full md:w-1.5 bg-gradient-to-b ${cert?.color || "from-indigo-500 to-violet-500"}`} />
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${cert?.color || "from-indigo-500 to-violet-500"} flex items-center justify-center text-xl`}>
                        {cert?.icon || "📚"}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Continue Learning</p>
                        <h2 className="font-semibold text-lg">{activeRoadmap.title}</h2>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-2xl font-bold gradient-text">{prog.percent}%</span>
                      <p className="text-xs text-muted-foreground">{prog.completed}/{prog.total} sections</p>
                    </div>
                  </div>
                  <Progress value={prog.percent} className="h-2 mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PlayCircle className="h-4 w-4 text-primary" />
                      <span>Up next: <span className="text-foreground font-medium">{nextSection?.title || "Start learning"}</span></span>
                    </div>
                    <Button size="sm" onClick={() => router.push(`/learn/${activeRoadmap.id}/${nextIdx}`)} className="bg-primary hover:bg-primary/90">
                      Continue <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* All Roadmaps */}
      {roadmaps.length > 1 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Your Learning Paths
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {roadmaps.map((roadmap) => {
              const prog = getRoadmapProgress(roadmap);
              const cert = getCertification(roadmap.certification_id);
              return (
                <Card
                  key={roadmap.id}
                  className="border-border hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => router.push(`/roadmap/${roadmap.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${cert?.color || "from-gray-500 to-gray-600"} flex items-center justify-center text-lg`}>
                        {cert?.icon || "📚"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{roadmap.title}</h3>
                        <Badge variant="secondary" className="text-xs mt-0.5">{cert?.code}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{prog.completed}/{prog.total} sections</span>
                      <span className="font-semibold text-foreground">{prog.percent}%</span>
                    </div>
                    <Progress value={prog.percent} className="h-1.5" />
                    {prog.percent === 100 && (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mt-2">
                        <CheckCircle className="h-3.5 w-3.5" /> Completed
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Quiz Scores */}
      {quizAttempts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Recent Quizzes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quizAttempts.slice(0, 4).map((attempt) => {
              const roadmap = roadmaps.find((r) => r.id === attempt.roadmap_id);
              const sectionTitle = roadmap?.sections?.[attempt.section_index]?.title || "Section";
              return (
                <Card key={attempt.id} className="border-border">
                  <CardContent className="py-3 px-4 text-center">
                    <div className={`text-2xl font-bold mb-1 ${attempt.score >= 80 ? "text-emerald-600" : attempt.score >= 60 ? "text-amber-600" : "text-red-500"}`}>
                      {attempt.score}%
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{sectionTitle}</p>
                    {attempt.score >= 80 && <Trophy className="h-4 w-4 text-amber-500 mx-auto mt-1" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Certifications */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Certification Paths
        </h2>
        <div className="grid md:grid-cols-3 gap-3">
          {certifications.map((cert) => {
            const existing = roadmaps.find((r) => r.certification_id === cert.id);
            return (
              <Card
                key={cert.id}
                className="border-border hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => router.push(existing ? `/roadmap/${existing.id}` : `/roadmap/generate?cert=${cert.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${cert.color} flex items-center justify-center text-xl`}>
                      {cert.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{cert.name}</h3>
                      <Badge variant="outline" className="text-xs mt-0.5">{cert.code}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cert.description}</p>
                  {existing ? (
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      View Roadmap
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Generate Roadmap <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
