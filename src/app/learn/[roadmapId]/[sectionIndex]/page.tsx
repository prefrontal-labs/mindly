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
interface Scenario { title: string; situation: string; question: string; solution: string; aws_services: string[]; }
interface Flashcard { front: string; back: string; }
interface LessonData { overview: string; concepts: Concept[]; scenario: Scenario | null; flashcards: Flashcard[]; }
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
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
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
          certification: c?.name || "AWS Solutions Architect Associate",
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("section_progress").upsert(
      { user_id: user.id, roadmap_id: roadmapId, section_index: sectionIndex, status: "completed", completed_at: new Date().toISOString() },
      { onConflict: "user_id,roadmap_id,section_index" }
    );
    toast.success("Section completed!");
    setCompleting(false);
    if (sectionIndex < totalSections - 1) router.push(`/learn/${roadmapId}/${sectionIndex + 1}`);
    else router.push(`/roadmap/${roadmapId}`);
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
      <div className="h-screen pt-14 flex flex-col bg-[#FAFBFF]">
        {/* Top bar */}
        <div className="border-b border-border bg-white px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push(`/roadmap/${roadmapId}`)}><ArrowLeft className="h-4 w-4" /></Button>
              <div><h1 className="font-semibold text-sm">{topicFilter || section.title}</h1><p className="text-xs text-muted-foreground">{topicFilter ? `${section.title} · Chapter ${sectionIndex + 1}` : `Chapter ${sectionIndex + 1} of ${totalSections}`}</p></div>
            </div>
            <div className="flex items-center gap-1">
              {milestoneItems.map((m) => (
                <button key={m.id} onClick={() => m.id === "quiz" ? router.push(`/quiz/${roadmapId}/${sectionIndex}`) : setActiveTab(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  <m.icon className="h-3.5 w-3.5" />{m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setChatOpen(!chatOpen)}><MessageSquare className="h-4 w-4 mr-1" />Tutor</Button>
              <Button size="sm" onClick={markComplete} disabled={completing} className="bg-emerald-600 hover:bg-emerald-700">
                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Complete</>}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main */}
          <div className="flex-1 overflow-y-auto p-6">
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
                  <div className={`grid gap-4 ${lesson.concepts?.length === 1 ? "md:grid-cols-1 max-w-2xl mx-auto" : "md:grid-cols-2"}`}>
                    {lesson.concepts?.map((concept, i) => (
                      <Card key={i} className="concept-card border-border overflow-hidden">
                        <CardContent className="p-5">
                          <h3 className="font-semibold text-base mb-2">{concept.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{concept.explanation}</p>
                          <div className="space-y-2 mb-3">
                            {concept.key_points?.map((pt, j) => (
                              <div key={j} className="flex items-start gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /><span>{pt}</span></div>
                            ))}
                          </div>
                          {concept.real_example && (
                            <div className="bg-amber-50 rounded-lg p-3 text-sm mb-3">
                              <div className="flex items-center gap-1 text-amber-700 font-medium text-xs mb-1"><Lightbulb className="h-3 w-3" />Real Example</div>
                              <p className="text-amber-900 text-xs leading-relaxed">{concept.real_example}</p>
                            </div>
                          )}
                          {concept.exam_tip && (
                            <div className="bg-violet-50 rounded-lg p-3">
                              <div className="flex items-center gap-1 text-violet-700 font-medium text-xs mb-1"><Target className="h-3 w-3" />Exam Tip</div>
                              <p className="text-violet-900 text-xs leading-relaxed">{concept.exam_tip}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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

              {/* SCENARIO */}
              {activeTab === "scenario" && lesson?.scenario && (
                <div className="max-w-2xl mx-auto space-y-5">
                  <div className="text-center mb-2"><h2 className="text-lg font-semibold">Real-World Scenario</h2><p className="text-sm text-muted-foreground">Think through this before revealing the answer</p></div>
                  <Card className="border-border overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm mb-3"><Lightbulb className="h-4 w-4" />{lesson.scenario.title}</div>
                      <p className="text-sm leading-relaxed mb-4">{lesson.scenario.situation}</p>
                      <div className="bg-amber-50 rounded-lg p-4 mb-4"><p className="text-sm font-semibold text-amber-800">{lesson.scenario.question}</p></div>
                      <div className="flex flex-wrap gap-2 mb-4">{lesson.scenario.aws_services?.map((svc, i) => (<Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700">{svc}</Badge>))}</div>
                      {!showSolution ? (
                        <Button onClick={() => setShowSolution(true)} className="w-full" variant="outline">Reveal Solution</Button>
                      ) : (
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm mb-2"><CheckCircle className="h-4 w-4" />Solution</div>
                          <p className="text-sm text-emerald-900 leading-relaxed">{lesson.scenario.solution}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <div className="text-center pt-2"><Button variant="outline" onClick={() => router.push(`/quiz/${roadmapId}/${sectionIndex}`)}>Take the Quiz <Target className="h-4 w-4 ml-2" /></Button></div>
                </div>
              )}
            </div>
          </div>

          {/* Chat panel */}
          {chatOpen && (
            <div className="w-96 border-l border-border bg-white flex flex-col overflow-hidden">
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
        <div className="border-t border-border bg-white px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled={sectionIndex === 0} onClick={() => router.push(`/learn/${roadmapId}/${sectionIndex - 1}`)}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button>
            <div className="flex gap-1.5">{Array.from({ length: totalSections }).map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all cursor-pointer ${i === sectionIndex ? "w-6 bg-primary" : "w-1.5 bg-gray-200"}`} onClick={() => router.push(`/learn/${roadmapId}/${i}`)} />))}</div>
            <Button variant="ghost" size="sm" disabled={sectionIndex >= totalSections - 1} onClick={() => router.push(`/learn/${roadmapId}/${sectionIndex + 1}`)}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      </div>
    </>
  );
}
