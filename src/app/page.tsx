"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Trophy,
  MessageSquare,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Brain, title: "AI Roadmaps", desc: "Personalized learning paths", color: "bg-indigo-50 text-indigo-600" },
  { icon: Layers, title: "Flashcards", desc: "Memorize key concepts fast", color: "bg-amber-50 text-amber-600" },
  { icon: Target, title: "Smart Quizzes", desc: "Scenario-based practice", color: "bg-emerald-50 text-emerald-600" },
  { icon: MessageSquare, title: "AI Tutor", desc: "Ask anything, anytime", color: "bg-pink-50 text-pink-600" },
  { icon: Zap, title: "Mock Interviews", desc: "Real interview practice", color: "bg-violet-50 text-violet-600" },
  { icon: Trophy, title: "Earn Badges", desc: "Track your milestones", color: "bg-orange-50 text-orange-600" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold gradient-text">Mindly</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/signup"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6">
              <Zap className="h-3.5 w-3.5" />
              Learn by doing, not just reading
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-5 leading-tight text-foreground">
              The smartest way to<br /><span className="gradient-text">master AI skills</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              AI-powered learning paths for Agentic AI & Generative AI. Interactive scenarios and real-world practice.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-base px-8 py-6 animate-pulse-glow">
                Start Learning Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border text-center concept-card"><div className="text-3xl mb-2">🤖</div><div className="text-sm font-semibold">Agentic AI</div><div className="text-xs text-muted-foreground mt-1">12 chapters</div></div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border text-center concept-card"><div className="text-3xl mb-2">✨</div><div className="text-sm font-semibold">Generative AI</div><div className="text-xs text-muted-foreground mt-1">10 chapters</div></div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border text-center concept-card"><div className="text-3xl mb-2">🚀</div><div className="text-sm font-semibold">AI Agents</div><div className="text-xs text-muted-foreground mt-1">Advanced</div></div>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Learn in <span className="gradient-text">4 simple steps</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{ num: "1", title: "Pick a course", icon: "🎯", bg: "bg-indigo-50" }, { num: "2", title: "AI builds your path", icon: "🗺️", bg: "bg-violet-50" }, { num: "3", title: "Learn & practice", icon: "⚡", bg: "bg-amber-50" }, { num: "4", title: "Master AI skills", icon: "🏆", bg: "bg-emerald-50" }].map((step) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: parseInt(step.num) * 0.1 }} className={`${step.bg} rounded-2xl p-5 text-center`}>
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="text-sm font-semibold text-foreground">{step.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Built for <span className="gradient-text">real learning</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border p-5 concept-card bg-background">
                <div className={`h-10 w-10 rounded-lg ${f.color} flex items-center justify-center mb-3`}><f.icon className="h-5 w-5" /></div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to <span className="gradient-text">get started</span>?</h2>
          <p className="text-muted-foreground mb-8">Free. No credit card. Start learning in 30 seconds.</p>
          <Link href="/signup"><Button size="lg" className="text-base px-8">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>

      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><span className="font-medium text-foreground">Mindly</span></div>
          <p>&copy; 2026 Mindly</p>
        </div>
      </footer>
    </div>
  );
}
