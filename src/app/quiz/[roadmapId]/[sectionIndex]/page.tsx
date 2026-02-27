"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCertification } from "@/lib/certifications";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Target,
} from "lucide-react";
import type { Roadmap, RoadmapSection, QuizQuestion } from "@/types";
import { toast } from "sonner";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = params.roadmapId as string;
  const sectionIndex = parseInt(params.sectionIndex as string);

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const supabase = createClient();

  const section: RoadmapSection | null = roadmap?.sections?.[sectionIndex] || null;
  const cert = roadmap ? getCertification(roadmap.certification_id) : null;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data, error } = await supabase
          .from("roadmaps")
          .select("*")
          .eq("id", roadmapId)
          .maybeSingle();

        if (error) console.error("[quiz] roadmap fetch error:", error.message);
        if (!data || controller.signal.aborted) { setLoading(false); return; }
        setRoadmap(data);
        const sec = data.sections?.[sectionIndex];
        if (!sec) { setLoading(false); return; }
        await generateQuiz(sec, data, false, controller.signal);
      } catch (e) {
        console.error("[quiz] load error:", e);
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [roadmapId, sectionIndex]);

  async function generateQuiz(sec: RoadmapSection, rm: Roadmap, skipCache = false, signal?: AbortSignal) {
    setLoading(true);
    try {
      const c = getCertification(rm.certification_id);
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTitle: sec.title,
          topics: sec.topics,
          certification: c?.name || "Agentic AI Fundamentals",
          difficulty: "medium",
          roadmapId: rm.id,
          sectionIndex,
          skipCache,
        }),
        signal,
      });
      const data = await res.json();
      if (data.questions?.length > 0) {
        setQuestions(data.questions);
      } else {
        toast.error("Failed to generate quiz questions");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Failed to load quiz");
    }
    setLoading(false);
  }

  function handleAnswer(answerIndex: number) {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (answerIndex === questions[currentQuestion].correct_answer) {
      setScore((s) => s + 1);
    }
  }

  async function handleNext() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
      await saveQuizAttempt();
    }
  }

  async function saveQuizAttempt() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const finalScore = Math.round((score / questions.length) * 100);

    await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      roadmap_id: roadmapId,
      section_index: sectionIndex,
      questions,
      user_answers: answers,
      score: finalScore,
    });
  }

  function restartQuiz() {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowExplanation(false);
    setQuizComplete(false);
    setScore(0);
    setLoading(true);
    if (section && roadmap) {
      generateQuiz(section, roadmap, true);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">AI is generating your quiz...</p>
        </div>
      </>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <Card className="bg-card border-border text-center">
            <CardContent className="py-12">
              <div className="text-6xl mb-4">
                {percentage >= 80 ? "🏆" : percentage >= 60 ? "👍" : "📚"}
              </div>
              <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-4xl font-bold gradient-text mb-2">
                {percentage}%
              </p>
              <p className="text-muted-foreground mb-6">
                You got {score} out of {questions.length} questions correct
              </p>

              {percentage >= 80 && (
                <Badge className="mb-6 bg-green-600 text-white">
                  <Trophy className="h-4 w-4 mr-1" />
                  Excellent! You've mastered this section!
                </Badge>
              )}

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={restartQuiz}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push(`/learn/${roadmapId}/${sectionIndex}`)}
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Lesson
                </Button>
                <Button
                  onClick={() => router.push(`/roadmap/${roadmapId}`)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const q = questions[currentQuestion];
  if (!q) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">No quiz questions available.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => section && roadmap && generateQuiz(section, roadmap, true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="ghost" onClick={() => router.push(`/learn/${roadmapId}/${sectionIndex}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lesson
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/learn/${roadmapId}/${sectionIndex}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Lesson
            </Button>
            <Badge variant="secondary">
              <Target className="h-3 w-3 mr-1" />
              {section?.title}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              Score: {score}/{currentQuestion + (showExplanation ? 1 : 0)}
            </span>
          </div>
          <Progress
            value={((currentQuestion + (showExplanation ? 1 : 0)) / questions.length) * 100}
            className="h-2 mt-2"
          />
        </div>

        {/* Question */}
        <Card className="bg-card border-border mb-4">
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === q.correct_answer;
              const showResult = showExplanation;

              let optionClass = "border-border hover:border-primary/50 cursor-pointer";
              if (showResult) {
                if (isCorrect) {
                  optionClass = "border-green-500 bg-green-500/10";
                } else if (isSelected && !isCorrect) {
                  optionClass = "border-red-500 bg-red-500/10";
                } else {
                  optionClass = "border-border opacity-50";
                }
              } else if (isSelected) {
                optionClass = "border-primary bg-primary/10";
              }

              return (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-2 transition-all ${optionClass}`}
                  onClick={() => handleAnswer(i)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{option}</span>
                    </div>
                    {showResult && isCorrect && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Explanation */}
        {showExplanation && (
          <Card className="bg-card border-border mb-4">
            <CardContent className="py-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                {selectedAnswer === q.correct_answer ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {selectedAnswer === q.correct_answer ? "Correct!" : "Incorrect"}
              </h4>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Next Button */}
        {showExplanation && (
          <Button
            onClick={handleNext}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {currentQuestion < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                See Results
                <Trophy className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );
}
