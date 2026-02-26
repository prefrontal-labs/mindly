"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  MessageSquare,
  Mic,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/types";
import { toast } from "sonner";

export default function InterviewPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startInterview() {
    setStarted(true);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hi, I'm ready to start the interview. Please begin." }],
          certification: "Agentic AI Fundamentals",
          sessionType: "interview",
        }),
      });
      const data = await res.json();
      setMessages([
        { role: "assistant", content: data.message },
      ]);
    } catch {
      toast.error("Failed to start interview");
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          certification: "Agentic AI Fundamentals",
          sessionType: "interview",
        }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message },
      ]);
    } catch {
      toast.error("Failed to get response");
    }
    setLoading(false);
  }

  function resetInterview() {
    setMessages([]);
    setStarted(false);
  }

  if (!started) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Mock Interview
            </div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Interview Preparation</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Practice with our AI interviewer who will ask you real Agentic AI
              and Generative AI questions and provide feedback on
              your answers.
            </p>
          </div>

          <Card className="bg-card border-border mb-6">
            <CardContent className="py-8">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-semibold mb-1">Scenario Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-world AI system design scenarios
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">💡</div>
                  <h3 className="font-semibold mb-1">Instant Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    Get feedback after each answer
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-semibold mb-1">Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Overall evaluation at the end
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={startInterview}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-lg px-8"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Mock Interview
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              The interview will cover 5-7 questions across AI topics including
              LLMs, agent architectures, RAG systems, prompt engineering, and production deployment.
            </p>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Mock Interview Session
            </h1>
            <Badge variant="secondary" className="mt-1">
              Agentic AI Fundamentals
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={resetInterview}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Interview
          </Button>
        </div>

        {/* Chat Area */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-6 ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    {msg.role === "assistant" && (
                      <span className="text-xs text-muted-foreground mt-1">
                        Interviewer
                      </span>
                    )}
                  </div>
                  <div
                    className={`inline-block max-w-[85%] p-4 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-left mb-6">
                  <div className="inline-block bg-muted p-4 rounded-xl">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your answer..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={2}
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-primary hover:bg-primary/90 self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
