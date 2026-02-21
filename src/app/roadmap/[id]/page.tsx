"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCertification } from "@/lib/certifications";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  PlayCircle,
  Lock,
  Clock,
  BookOpen,
  Target,
  Loader2,
  ArrowRight,
  Trophy,
  Sparkles,
  Circle,
  ChevronDown,
  Layers,
  Lightbulb,
} from "lucide-react";
import type { Roadmap, RoadmapSection, SectionProgress } from "@/types";

type ChapterState = "completed" | "in_progress" | "available" | "locked";

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<SectionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const activeRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadRoadmap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roadmapData } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("id", params.id)
        .single();

      if (roadmapData) {
        setRoadmap(roadmapData);

        const { data: progressData } = await supabase
          .from("section_progress")
          .select("*")
          .eq("roadmap_id", params.id)
          .eq("user_id", user.id);

        if (progressData) setProgress(progressData);
      }
      setLoading(false);
    }
    loadRoadmap();
  }, [params.id, supabase]);

  // Auto-scroll to active chapter after load
  useEffect(() => {
    if (!loading && activeRef.current) {
      setTimeout(() => {
        activeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  }, [loading]);

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

  if (!roadmap) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Roadmap not found</p>
        </div>
      </>
    );
  }

  const cert = getCertification(roadmap.certification_id);
  const sections: RoadmapSection[] = roadmap.sections || [];
  const completedCount = progress.filter(
    (p) => p.status === "completed"
  ).length;
  const progressPercent =
    sections.length > 0 ? (completedCount / sections.length) * 100 : 0;

  function getSectionStatus(index: number) {
    const p = progress.find((pr) => pr.section_index === index);
    return p?.status || "not_started";
  }

  function getChapterState(index: number): ChapterState {
    const status = getSectionStatus(index);
    if (status === "completed") return "completed";
    if (status === "in_progress") return "in_progress";
    if (index === 0) return "available";
    const prevStatus = getSectionStatus(index - 1);
    if (prevStatus === "completed") return "available";
    return "locked";
  }

  const totalHours = sections.reduce(
    (sum, s) => sum + (s.estimated_hours || 0),
    0
  );
  const completedHours = sections.reduce((sum, s, i) => {
    if (getSectionStatus(i) === "completed") return sum + (s.estimated_hours || 0);
    return sum;
  }, 0);

  // Find the first active/available chapter
  const activeIndex = sections.findIndex((_, i) => {
    const state = getChapterState(i);
    return state === "in_progress" || state === "available";
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f0f9ff] pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-start gap-4 mb-6">
              {cert && (
                <div
                  className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${cert.color} flex items-center justify-center text-3xl shadow-lg`}
                >
                  {cert.icon}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {roadmap.title}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary">{cert?.code}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {roadmap.experience_level}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Journey Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Completed
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {completedCount}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{sections.length}
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Progress
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {Math.round(progressPercent)}%
                </p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Time Left
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {totalHours - completedHours}
                  <span className="text-sm font-normal text-muted-foreground">
                    h
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-violet-600 mb-1">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Status
                  </span>
                </div>
                <p className="text-sm font-semibold mt-1">
                  {completedCount === sections.length
                    ? "Complete!"
                    : activeIndex >= 0
                      ? `Ch. ${activeIndex + 1}`
                      : "Not Started"}
                </p>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="mt-4 bg-white rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Journey</span>
                <span className="text-xs text-muted-foreground">
                  {completedCount} of {sections.length} chapters completed
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>

          {/* Learning Path */}
          <div className="relative">
            {/* Central path line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 hidden md:block">
              {/* Completed portion */}
              <div
                className="w-full bg-gradient-to-b from-emerald-400 to-primary rounded-full transition-all duration-700"
                style={{
                  height:
                    sections.length > 1
                      ? `${(Math.max(0, completedCount) / (sections.length - 1)) * 100}%`
                      : "0%",
                }}
              />
              {/* Remaining portion */}
              <div className="w-full bg-gray-200 flex-1" />
            </div>

            {/* Mobile: left-side path line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 md:hidden">
              <div
                className="w-full bg-gradient-to-b from-emerald-400 to-primary rounded-full transition-all duration-700"
                style={{
                  height:
                    sections.length > 1
                      ? `${(Math.max(0, completedCount) / (sections.length - 1)) * 100}%`
                      : "0%",
                }}
              />
              <div className="w-full bg-gray-200 flex-1" />
            </div>

            {/* Chapter nodes */}
            <div className="space-y-6 md:space-y-8">
              {sections.map((section, index) => {
                const state = getChapterState(index);
                const isLeft = index % 2 === 0;
                const isActive =
                  state === "in_progress" || state === "available";

                return (
                  <div
                    key={index}
                    ref={
                      index === activeIndex ? activeRef : undefined
                    }
                    className={`relative flex items-start gap-4 md:gap-0 ${
                      isLeft
                        ? "md:flex-row"
                        : "md:flex-row-reverse"
                    }`}
                  >
                    {/* Mobile: Node on the left */}
                    <div className="relative z-10 shrink-0 md:hidden">
                      <PathNode state={state} />
                    </div>

                    {/* Card side */}
                    <div
                      className={`flex-1 md:w-[calc(50%-2rem)] ${
                        isLeft ? "md:pr-12" : "md:pl-12"
                      }`}
                    >
                      <ChapterCard
                        section={section}
                        index={index}
                        state={state}
                        onNavigate={(tab, topicName) =>
                          tab === "quiz"
                            ? router.push(`/quiz/${roadmap.id}/${index}`)
                            : router.push(
                                `/learn/${roadmap.id}/${index}?tab=${tab}&topic=${encodeURIComponent(topicName)}`
                              )
                        }
                      />
                    </div>

                    {/* Desktop: Center node */}
                    <div className="absolute left-1/2 top-4 -translate-x-1/2 z-10 hidden md:block">
                      <PathNode state={state} />
                    </div>

                    {/* Desktop: Empty space on the other side */}
                    <div className="hidden md:block md:w-[calc(50%-2rem)]" />

                    {/* Connector line from card to center node (desktop) */}
                    <div
                      className={`absolute top-7 hidden md:block h-0.5 w-8 ${
                        state === "completed"
                          ? "bg-emerald-400"
                          : state === "in_progress"
                            ? "bg-primary"
                            : state === "available"
                              ? "bg-gray-300"
                              : "bg-gray-200"
                      } ${
                        isLeft
                          ? "right-[calc(50%+0.75rem)]"
                          : "left-[calc(50%+0.75rem)]"
                      }`}
                    />
                  </div>
                );
              })}

              {/* Finish node */}
              <div className="relative flex items-start gap-4 md:justify-center">
                <div className="relative z-10 shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg ${
                      completedCount === sections.length
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                        : "bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300"
                    }`}
                  >
                    <Trophy className="h-5 w-5" />
                  </div>
                </div>
                <div className="md:mt-16 text-center md:w-full">
                  <p
                    className={`text-sm font-semibold ${
                      completedCount === sections.length
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {completedCount === sections.length
                      ? "Certification Ready!"
                      : "Complete all chapters to finish"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PathNode({ state }: { state: ChapterState }) {
  const base = "h-10 w-10 rounded-full flex items-center justify-center shadow-md relative transition-all duration-300";

  switch (state) {
    case "completed":
      return (
        <div className={`${base} bg-emerald-500 text-white`}>
          <CheckCircle className="h-5 w-5" />
        </div>
      );
    case "in_progress":
      return (
        <div className={`${base} bg-primary text-white path-node-active`}>
          <PlayCircle className="h-5 w-5" />
        </div>
      );
    case "available":
      return (
        <div className={`${base} bg-white border-2 border-primary text-primary`}>
          <Sparkles className="h-5 w-5" />
        </div>
      );
    case "locked":
      return (
        <div className={`${base} bg-gray-100 border-2 border-gray-200 text-gray-400`}>
          <Lock className="h-4 w-4" />
        </div>
      );
  }
}

const topicActions = [
  { id: "learn" as const, label: "Learn", icon: BookOpen, color: "bg-primary text-white hover:bg-primary/90" },
  { id: "flashcards" as const, label: "Flashcards", icon: Layers, color: "bg-violet-500 text-white hover:bg-violet-600" },
  { id: "scenario" as const, label: "Scenario", icon: Lightbulb, color: "bg-amber-500 text-white hover:bg-amber-600" },
  { id: "quiz" as const, label: "Quiz", icon: Target, color: "bg-emerald-500 text-white hover:bg-emerald-600" },
];

function ChapterCard({
  section,
  index,
  state,
  onNavigate,
}: {
  section: RoadmapSection;
  index: number;
  state: ChapterState;
  onNavigate: (tab: "learn" | "flashcards" | "scenario" | "quiz", topicName: string) => void;
}) {
  const isLocked = state === "locked";
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);

  return (
    <div
      className={`chapter-card bg-white rounded-2xl border p-5 ${
        isLocked
          ? "chapter-locked border-gray-200"
          : state === "in_progress"
            ? "border-primary/40 ring-2 ring-primary/10"
            : state === "completed"
              ? "border-emerald-200"
              : "border-border hover:border-primary/30"
      }`}
    >
      {/* Chapter header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              state === "completed"
                ? "text-emerald-600"
                : state === "in_progress"
                  ? "text-primary"
                  : "text-muted-foreground"
            }`}
          >
            Chapter {index + 1}
          </span>
          <h3 className="text-lg font-bold mt-0.5 leading-tight">
            {section.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0 ml-3">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs">{section.estimated_hours}h</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {section.description}
      </p>

      {/* Interactive Topics */}
      <div className="space-y-1.5 mb-4">
        {section.topics?.map((topic, ti) => {
          const isExpanded = expandedTopic === ti;
          const canInteract = !isLocked;

          return (
            <div key={ti} className="rounded-lg overflow-hidden">
              {/* Topic row */}
              <button
                onClick={() => {
                  if (!canInteract) return;
                  setExpandedTopic(isExpanded ? null : ti);
                }}
                disabled={isLocked}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all rounded-lg ${
                  canInteract
                    ? isExpanded
                      ? "bg-primary/5 border border-primary/20"
                      : "hover:bg-gray-50 border border-transparent"
                    : "border border-transparent cursor-default"
                }`}
              >
                {state === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : isExpanded ? (
                  <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 shrink-0" />
                )}
                <span
                  className={`text-sm flex-1 ${
                    state === "completed"
                      ? "text-emerald-700 font-medium"
                      : isExpanded
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                  }`}
                >
                  {topic}
                </span>
                {canInteract && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Expanded action buttons */}
              {isExpanded && canInteract && (
                <div className="px-3 pb-2 pt-1">
                  <div className="grid grid-cols-4 gap-1.5">
                    {topicActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => onNavigate(action.id, topic)}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${action.color} shadow-sm`}
                      >
                        <action.icon className="h-4 w-4" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom status / CTA */}
      {state === "completed" && (
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
          <span className="text-xs text-muted-foreground ml-1">
            Tap any topic to review
          </span>
        </div>
      )}

      {state === "in_progress" && (
        <p className="text-xs text-primary font-medium flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Tap a topic to continue learning
        </p>
      )}

      {state === "available" && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Tap a topic to get started
        </p>
      )}

      {state === "locked" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-xs">Complete previous chapter to unlock</span>
        </div>
      )}
    </div>
  );
}
