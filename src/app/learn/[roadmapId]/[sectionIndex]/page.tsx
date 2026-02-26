"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCertification } from "@/lib/certifications";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import {
  Loader2, BookOpen, MessageSquare, Send, CheckCircle,
  ArrowLeft, ArrowRight, Target, X, Lightbulb, Layers,
  Zap, ChevronLeft, ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Roadmap, RoadmapSection, ChatMessage } from "@/types";
import { toast } from "sonner";

interface Concept { title: string; explanation: string; key_points: string[]; real_example: string; exam_tip: string; }
interface Scenario { title: string; situation: string; question: string; options: string[]; correct_index: number; explanation: string; key_concepts: string[]; }
interface Flashcard { front: string; back: string; }
interface LessonData { overview: string; concepts: Concept[]; scenarios: Scenario[]; flashcards: Flashcard[]; }
type Tab = "learn" | "flashcards" | "scenario" | "quiz";

const milestoneItems: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "scenario", label: "Scenario", icon: Lightbulb },
  { id: "quiz", label: "Quiz", icon: Target },
];

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapId = params.roadmapId as string;
  const sectionIndex = parseInt(params.sectionIndex as string);

  const initialTab = (searchParams.get("tab") as Tab) || "learn";
  const topicFilter = searchParams.get("topic") || null;
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [currentConcept, setCurrentConcept] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [scenarioAnswers, setScenarioAnswers] = useState<{ [key: number]: number }>({});
  const [scenarioSubmitted, setScenarioSubmitted] = useState<{ [key: number]: boolean }>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const section: RoadmapSection | null = roadmap?.sections?.[sectionIndex] || null;
  const cert = roadmap ? getCertification(roadmap.certification_id) : null;
  const totalSections = roadmap?.sections?.length || 0;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const { data } = await supabase.from("roadmaps").select("*").eq("id", roadmapId).single();
      if (data && !controller.signal.aborted) {
        setRoadmap(data);
        const sec = data.sections?.[sectionIndex];
        if (sec) { await generateLesson(sec, data, controller.signal); await markInProgress(data); }
      }
    }
    load();
    return () => controller.abort();
  }, [roadmapId, sectionIndex, topicFilter]);

  async function generateLesson(sec: RoadmapSection, rm: Roadmap, signal?: AbortSignal) {
    setLoading(true);
    try {
      const c = getCertification(rm.certification_id);
      // If a specific topic is selected, generate content for just that topic
      const topics = topicFilter ? [topicFilter] : sec.topics;
      const title = topicFilter || sec.title;
      const res = await fetch("/api/ai/generate-lesson", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTitle: title,
          topics,
          certification: c?.name || "Agentic AI Fundamentals",
          roadmapId: rm.id,
          sectionIndex,
          topicFilter: topicFilter || undefined,
        }),
        signal,
      });
      const data = await res.json();
      setLesson(data.lesson);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Failed to load lesson");
    }
    setLoading(false);
  }

  async function markInProgress(rm: Roadmap) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("section_progress").upsert(
      { user_id: user.id, roadmap_id: rm.id, section_index: sectionIndex, status: "in_progress" },
      { onConflict: "user_id,roadmap_id,section_index" }
    );
  }

  async function markComplete() {
    setCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("section_progress").upsert(
        { user_id: user.id, roadmap_id: roadmapId, section_index: sectionIndex, status: "completed", completed_at: new Date().toISOString() },
        { onConflict: "user_id,roadmap_id,section_index" }
      );
      if (error) throw new Error(error.message);
      toast.success(sectionIndex < totalSections - 1 ? "Chapter complete! Next chapter unlocked." : "All chapters complete!");
      router.push(`/roadmap/${roadmapId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark complete");
      setCompleting(false);
    }
  }

  function toggleFlashcard(i: number) {
    setFlippedCards((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage: ChatMessage = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages); setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, sectionTitle: section?.title, topics: section?.topics, certification: cert?.name, sessionType: "tutor" }),
      });
      const data = await res.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch { toast.error("Failed to get response"); }
    setChatLoading(false);
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  if (loading || !roadmap || !section) {
    return (<><Navbar /><div className="min-h-screen flex flex-col items-center justify-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-muted-foreground">AI is preparing your lesson...</p></div></>);
  }

  return (
    <><Navbar />
      <div className="h-screen pt-14 flex flex-col bg-[#f0f9ff]">
        {/* Top bar */}
        <div className="border-b border-border bg-white px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto space-y-2">
            {/* Row 1: back + title + action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="sm" className="shrink-0 px-2" onClick={() => router.push(`/roadmap/${roadmapId}`)}><ArrowLeft className="h-4 w-4" /></Button>
                <div className="min-w-0">
                  <h1 className="font-semibold text-sm truncate">{topicFilter || section.title}</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">{topicFilter ? `${section.title} · Ch. ${sectionIndex + 1}` : `Chapter ${sectionIndex + 1} of ${totalSections}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="sm" className="px-2" onClick={() => setChatOpen(!chatOpen)}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={markComplete} disabled={completing} className="bg-emerald-600 hover:bg-emerald-700 text-xs px-3">
                  {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1" />Mark Complete</>}
                </Button>
              </div>
            </div>
            {/* Row 2: horizontally scrollable tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
              {milestoneItems.map((m) => (
                <button key={m.id} onClick={() => m.id === "quiz" ? router.push(`/quiz/${roadmapId}/${sectionIndex}`) : setActiveTab(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  <m.icon className="h-3.5 w-3.5" />{m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">

              {/* LEARN */}
              {activeTab === "learn" && lesson && (
                <div className="space-y-5">
                  {topicFilter && (
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        Focused: {topicFilter}
                      </Badge>
                      <button
                        onClick={() => router.replace(`/learn/${roadmapId}/${sectionIndex}?tab=learn`)}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Show all topics
                      </button>
                    </div>
                  )}
                  <div className="bg-indigo-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-2"><Zap className="h-4 w-4" />Why this matters</div>
                    <p className="text-sm text-indigo-900 leading-relaxed">{lesson.overview}</p>
                  </div>

                  {lesson.concepts && lesson.concepts.length > 0 && (
                    <div className="max-w-2xl mx-auto">
                      <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground">
                          Concept {currentConcept + 1} of {lesson.concepts.length}
                        </p>
                      </div>

                      <Card className="concept-card border-border overflow-hidden mb-4">
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg mb-3">{lesson.concepts[currentConcept].title}</h3>
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lesson.concepts[currentConcept].explanation}</p>
                          <div className="space-y-2 mb-4">
                            {lesson.concepts[currentConcept].key_points?.map((pt, j) => (
                              <div key={j} className="flex items-start gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /><span>{pt}</span></div>
                            ))}
                          </div>
                          {lesson.concepts[currentConcept].real_example && (
                            <div className="bg-amber-50 rounded-lg p-4 text-sm mb-4">
                              <div className="flex items-center gap-1 text-amber-700 font-medium text-xs mb-2"><Lightbulb className="h-3 w-3" />Real Example</div>
                              <p className="text-amber-900 text-xs leading-relaxed">{lesson.concepts[currentConcept].real_example}</p>
                            </div>
                          )}
                          {lesson.concepts[currentConcept].exam_tip && (
                            <div className="bg-violet-50 rounded-lg p-4">
                              <div className="flex items-center gap-1 text-violet-700 font-medium text-xs mb-2"><Target className="h-3 w-3" />Pro Tip</div>
                              <p className="text-violet-900 text-xs leading-relaxed">{lesson.concepts[currentConcept].exam_tip}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="flex items-center justify-center gap-4 mb-6">
                        <Button variant="outline" size="sm" disabled={currentConcept === 0} onClick={() => setCurrentConcept((c) => c - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <div className="flex gap-1.5">{lesson.concepts.map((_, i) => (<div key={i} className={`h-2 w-2 rounded-full transition-colors cursor-pointer ${i === currentConcept ? "bg-primary" : "bg-gray-200"}`} onClick={() => setCurrentConcept(i)} />))}</div>
                        <Button variant="outline" size="sm" disabled={currentConcept === lesson.concepts.length - 1} onClick={() => setCurrentConcept((c) => c + 1)}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4"><Button variant="outline" onClick={() => setActiveTab("flashcards")}>Continue to Flashcards <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
                </div>
              )}

              {/* FLASHCARDS */}
              {activeTab === "flashcards" && lesson?.flashcards && (
                <div className="max-w-lg mx-auto">
                  <div className="text-center mb-6"><h2 className="text-lg font-semibold">Review Key Concepts</h2><p className="text-sm text-muted-foreground">Click to flip. {currentFlashcard + 1} of {lesson.flashcards.length}</p></div>
                  <div className="flashcard-container h-64 cursor-pointer mb-6" onClick={() => toggleFlashcard(currentFlashcard)}>
                    <div className={`flashcard-inner h-full ${flippedCards.has(currentFlashcard) ? "flipped" : ""}`}>
                      <div className="flashcard-front bg-white border-2 border-indigo-100 shadow-lg flex flex-col items-center justify-center p-8 text-center">
                        <Layers className="h-6 w-6 text-indigo-400 mb-3" />
                        <p className="text-lg font-medium">{lesson.flashcards[currentFlashcard]?.front}</p>
                        <p className="text-xs text-muted-foreground mt-3">Click to reveal</p>
                      </div>
                      <div className="flashcard-back bg-indigo-50 border-2 border-indigo-200 flex flex-col items-center justify-center p-8 text-center">
                        <CheckCircle className="h-6 w-6 text-emerald-500 mb-3" />
                        <p className="text-base text-indigo-900 leading-relaxed">{lesson.flashcards[currentFlashcard]?.back}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" size="sm" disabled={currentFlashcard === 0} onClick={() => { setCurrentFlashcard((c) => c - 1); setFlippedCards(new Set()); }}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="flex gap-1.5">{lesson.flashcards.map((_, i) => (<div key={i} className={`h-2 w-2 rounded-full transition-colors cursor-pointer ${i === currentFlashcard ? "bg-primary" : "bg-gray-200"}`} onClick={() => { setCurrentFlashcard(i); setFlippedCards(new Set()); }} />))}</div>
                    <Button variant="outline" size="sm" disabled={currentFlashcard === lesson.flashcards.length - 1} onClick={() => { setCurrentFlashcard((c) => c + 1); setFlippedCards(new Set()); }}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                  <div className="text-center mt-8"><Button variant="outline" onClick={() => setActiveTab("scenario")}>Continue to Scenario <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
                </div>
              )}

              {/* SCENARIOS */}
              {activeTab === "scenario" && lesson?.scenarios && lesson.scenarios.length > 0 && (
                <div className="max-w-2xl mx-auto space-y-5">
                  <div className="text-center mb-2"><h2 className="text-lg font-semibold">Real-World Scenarios</h2><p className="text-sm text-muted-foreground">Test your understanding with multiple-choice questions</p></div>
                  {lesson.scenarios.map((scenario, idx) => {
                    const selectedAnswer = scenarioAnswers[idx];
                    const isSubmitted = scenarioSubmitted[idx];
                    const isCorrect = selectedAnswer === scenario.correct_index;

                    return (
                      <Card key={idx} className="border-border overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm mb-3">
                            <Lightbulb className="h-4 w-4" />
                            Scenario {idx + 1}: {scenario.title}
                          </div>
                          <p className="text-sm leading-relaxed mb-4">{scenario.situation}</p>
                          <div className="bg-amber-50 rounded-lg p-4 mb-4">
                            <p className="text-sm font-semibold text-amber-800">{scenario.question}</p>
                          </div>

                          <div className="space-y-2 mb-4">
                            {scenario.options.map((option, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => !isSubmitted && setScenarioAnswers({ ...scenarioAnswers, [idx]: optIdx })}
                                disabled={isSubmitted}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  isSubmitted
                                    ? optIdx === scenario.correct_index
                                      ? "border-emerald-500 bg-emerald-50"
                                      : optIdx === selectedAnswer
                                      ? "border-red-500 bg-red-50"
                                      : "border-border bg-background opacity-50"
                                    : selectedAnswer === optIdx
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-background hover:border-primary/50"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                    isSubmitted && optIdx === scenario.correct_index
                                      ? "border-emerald-500 bg-emerald-500"
                                      : isSubmitted && optIdx === selectedAnswer
                                      ? "border-red-500 bg-red-500"
                                      : selectedAnswer === optIdx
                                      ? "border-primary bg-primary"
                                      : "border-border"
                                  }`}>
                                    {((isSubmitted && optIdx === scenario.correct_index) || (isSubmitted && optIdx === selectedAnswer)) && (
                                      <CheckCircle className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <span className="text-sm">{option}</span>
                                </div>
                              </button>
                            ))}
                          </div>

                          {!isSubmitted ? (
                            <Button
                              onClick={() => setScenarioSubmitted({ ...scenarioSubmitted, [idx]: true })}
                              disabled={selectedAnswer === undefined}
                              className="w-full"
                            >
                              Submit Answer
                            </Button>
                          ) : (
                            <div className={`rounded-lg p-4 border ${isCorrect ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                              <div className="flex items-center gap-2 font-medium text-sm mb-2">
                                <CheckCircle className={`h-4 w-4 ${isCorrect ? "text-emerald-700" : "text-red-700"}`} />
                                <span className={isCorrect ? "text-emerald-700" : "text-red-700"}>
                                  {isCorrect ? "Correct!" : "Incorrect"}
                                </span>
                              </div>
                              <p className={`text-sm leading-relaxed ${isCorrect ? "text-emerald-900" : "text-red-900"}`}>{scenario.explanation}</p>
                              {scenario.key_concepts && scenario.key_concepts.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {scenario.key_concepts.map((concept, i) => (
                                    <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700">{concept}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  <div className="text-center pt-2"><Button variant="outline" onClick={() => router.push(`/quiz/${roadmapId}/${sectionIndex}`)}>Take Quiz <ArrowRight className="h-4 w-4 ml-2" /></Button></div>
                </div>
              )}
            </div>
          </div>

          {/* Chat panel — full screen on mobile, side panel on desktop */}
          {chatOpen && (
            <div className="fixed inset-0 z-40 bg-white flex flex-col sm:relative sm:inset-auto sm:z-auto sm:w-96 sm:border-l sm:border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><MessageSquare className="h-4 w-4 text-primary" /></div>
                  <div><h3 className="text-sm font-semibold">AI Tutor</h3><p className="text-xs text-muted-foreground">Ask me anything</p></div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-10">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Ask about {section.title}</p>
                    <div className="mt-4 space-y-2">
                      {["Explain this simply", "Give me an example", "How is this tested?"].map((q) => (
                        <button key={q} onClick={() => setChatInput(q)} className="block w-full text-left text-xs bg-muted rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent transition-colors">{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    <div className={`inline-block max-w-[85%] p-3 rounded-xl text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <div className="prose-content text-sm [&_p]:mb-1 [&_p]:text-inherit"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    </div>
                  </div>
                ))}
                {chatLoading && <div className="mb-3"><div className="inline-block bg-muted p-3 rounded-xl"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-border shrink-0">
                <div className="flex gap-2">
                  <Textarea placeholder="Ask your tutor..." value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    className="min-h-[40px] max-h-24 resize-none text-sm" rows={1} />
                  <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} size="sm"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="border-t border-border bg-white px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled={sectionIndex === 0} onClick={() => router.push(`/learn/${roadmapId}/${sectionIndex - 1}`)}><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline ml-1">Previous</span></Button>
            <div className="flex gap-1">{Array.from({ length: totalSections }).map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all cursor-pointer ${i === sectionIndex ? "w-5 bg-primary" : "w-1.5 bg-gray-200"}`} onClick={() => router.push(`/learn/${roadmapId}/${i}`)} />))}</div>
            <Button variant="ghost" size="sm" disabled={sectionIndex >= totalSections - 1} onClick={() => router.push(`/learn/${roadmapId}/${sectionIndex + 1}`)}><span className="hidden sm:inline mr-1">Next</span><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </>
  );
}
