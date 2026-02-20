"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { badgeDefinitions } from "@/lib/badges";
import { getCertification } from "@/lib/certifications";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Target,
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  Loader2,
} from "lucide-react";
import type { Roadmap, SectionProgress, UserBadge } from "@/types";

export default function ProgressPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [progressData, setProgressData] = useState<SectionProgress[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [quizCount, setQuizCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [roadmapRes, progressRes, badgeRes, quizRes] = await Promise.all([
        supabase.from("roadmaps").select("*").eq("user_id", user.id),
        supabase.from("section_progress").select("*").eq("user_id", user.id),
        supabase.from("user_badges").select("*").eq("user_id", user.id),
        supabase.from("quiz_attempts").select("id").eq("user_id", user.id),
      ]);

      if (roadmapRes.data) setRoadmaps(roadmapRes.data);
      if (progressRes.data) setProgressData(progressRes.data);
      if (badgeRes.data) setEarnedBadges(badgeRes.data);
      if (quizRes.data) setQuizCount(quizRes.data.length);

      setLoading(false);
    }
    loadProgress();
  }, [supabase]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const completedSections = progressData.filter((p) => p.status === "completed").length;
  const totalSections = roadmaps.reduce(
    (acc, r) => acc + (r.sections?.length || 0),
    0
  );

  const stats = [
    {
      icon: BookOpen,
      label: "Lessons Completed",
      value: completedSections,
      color: "text-blue-500",
    },
    {
      icon: Target,
      label: "Quizzes Taken",
      value: quizCount,
      color: "text-green-500",
    },
    {
      icon: Trophy,
      label: "Badges Earned",
      value: earnedBadges.length,
      color: "text-yellow-500",
    },
    {
      icon: TrendingUp,
      label: "Active Paths",
      value: roadmaps.length,
      color: "text-purple-500",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Your <span className="gradient-text">Progress</span>
          </h1>
          <p className="text-muted-foreground">
            Track your learning journey and achievements.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="py-4 text-center">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Roadmap Progress */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Learning Paths
          </h2>
          {roadmaps.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                No active learning paths yet. Start one from the dashboard!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {roadmaps.map((roadmap) => {
                const cert = getCertification(roadmap.certification_id);
                const sectionCount = roadmap.sections?.length || 0;
                const completed = progressData.filter(
                  (p) =>
                    p.roadmap_id === roadmap.id && p.status === "completed"
                ).length;
                const percent =
                  sectionCount > 0 ? (completed / sectionCount) * 100 : 0;

                return (
                  <Card key={roadmap.id} className="bg-card border-border">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg bg-gradient-to-br ${cert?.color || "from-gray-500 to-gray-600"} flex items-center justify-center text-lg`}
                          >
                            {cert?.icon || "📚"}
                          </div>
                          <div>
                            <h3 className="font-semibold">{roadmap.title}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {cert?.code}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold gradient-text">
                            {Math.round(percent)}%
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {completed}/{sectionCount} sections
                          </p>
                        </div>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Badges
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badgeDefinitions.map((badge) => {
              const earned = earnedBadges.some(
                (eb) => eb.badge_id === badge.id
              );
              return (
                <Card
                  key={badge.id}
                  className={`bg-card border-border transition-all ${
                    earned ? "border-primary/50" : "opacity-50"
                  }`}
                >
                  <CardContent className="py-6 text-center">
                    <div
                      className={`text-4xl mb-2 ${earned ? "" : "grayscale"}`}
                    >
                      {badge.icon}
                    </div>
                    <h3 className="font-semibold text-sm">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </p>
                    {earned && (
                      <Badge className="mt-2 bg-green-600 text-white text-xs">
                        Earned!
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
