import { Certification } from "@/types";

export const certifications: Certification[] = [
  {
    id: "agentic-ai-fundamentals",
    name: "Agentic AI Fundamentals",
    code: "AAI-101",
    provider: "AI Academy",
    description:
      "Master the fundamentals of building autonomous AI agents. Learn agent architectures, tool use, memory systems, and multi-agent orchestration.",
    icon: "🤖",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "generative-ai-professional",
    name: "Generative AI Professional",
    code: "GAI-201",
    provider: "AI Academy",
    description:
      "Deep dive into generative AI models, prompt engineering, RAG systems, fine-tuning, and production deployment of LLM applications.",
    icon: "✨",
    color: "from-blue-500 to-purple-500",
  },
  {
    id: "ai-agent-engineering",
    name: "AI Agent Engineering",
    code: "AAE-301",
    provider: "AI Academy",
    description:
      "Advanced course on building production-grade AI agents. Covers planning, reasoning, tool integration, safety, and enterprise deployment.",
    icon: "🚀",
    color: "from-indigo-500 to-cyan-500",
  },
];

export function getCertification(id: string): Certification | undefined {
  return certifications.find((c) => c.id === id);
}
