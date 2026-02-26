import { NextResponse } from "next/server";
import groq, { SMART_MODEL, extractJsonArray } from "@/lib/groq";
import { generateRoadmapPrompt } from "@/lib/prompts/roadmap";

export async function POST(request: Request) {
  try {
    const { certification, experienceLevel } = await request.json();

    const prompt = generateRoadmapPrompt(certification, experienceLevel);

    const completion = await groq.chat.completions.create({
      model: SMART_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 5000,
    });

    const content = completion.choices[0]?.message?.content || "[]";

    let roadmap;
    try {
      roadmap = extractJsonArray(content);
    } catch {
      roadmap = getDefaultRoadmap(experienceLevel);
    }

    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error("Roadmap generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}

function getDefaultRoadmap(level: string) {
  const sections = [
    { title: "AI Fundamentals", description: "Understanding artificial intelligence, machine learning basics, and LLM concepts", topics: ["What is AI & Machine Learning", "Neural Networks Basics", "Large Language Models (LLMs)", "Transformers Architecture", "AI Safety & Ethics"], estimated_hours: 4, order: 1 },
    { title: "Prompt Engineering", description: "Master the art of crafting effective prompts for LLMs", topics: ["Prompt Patterns & Techniques", "Few-shot & Zero-shot Learning", "Chain of Thought Prompting", "System Prompts & Temperature", "Prompt Optimization"], estimated_hours: 5, order: 2 },
    { title: "LLM APIs & Integration", description: "Working with OpenAI, Anthropic, and other LLM APIs", topics: ["OpenAI API & GPT Models", "Claude API Integration", "API Key Management", "Rate Limiting & Costs", "Streaming Responses"], estimated_hours: 4, order: 3 },
    { title: "Agent Architectures", description: "Understanding different AI agent patterns and frameworks", topics: ["ReAct Pattern", "Planning Agents", "ReWOO Architecture", "Multi-Agent Systems", "Agent Memory Systems"], estimated_hours: 5, order: 4 },
    { title: "Tool Use & Function Calling", description: "Enabling agents to interact with external tools and APIs", topics: ["Function Calling Basics", "Tool Definition & Schema", "Tool Execution Patterns", "Error Handling", "Tool Composition"], estimated_hours: 4, order: 5 },
    { title: "RAG Systems", description: "Retrieval Augmented Generation for grounded responses", topics: ["Vector Databases", "Embeddings & Similarity", "Chunking Strategies", "Retrieval Optimization", "Hybrid Search"], estimated_hours: 5, order: 6 },
    { title: "Agent Memory & State", description: "Managing conversation history and agent state", topics: ["Short-term vs Long-term Memory", "Conversation Summarization", "Memory Retrieval", "State Management", "Context Window Optimization"], estimated_hours: 4, order: 7 },
    { title: "Multi-Agent Orchestration", description: "Coordinating multiple agents for complex tasks", topics: ["Agent Communication Patterns", "Task Delegation", "Consensus Mechanisms", "Agent Hierarchies", "Workflow Orchestration"], estimated_hours: 5, order: 8 },
    { title: "Fine-tuning & Customization", description: "Adapting LLMs to specific domains and use cases", topics: ["When to Fine-tune", "Dataset Preparation", "LoRA & QLoRA", "Evaluation Metrics", "Model Deployment"], estimated_hours: 6, order: 9 },
    { title: "Production Deployment", description: "Deploying AI agents to production environments", topics: ["Deployment Patterns", "Monitoring & Observability", "Cost Optimization", "Latency Management", "Error Recovery"], estimated_hours: 5, order: 10 },
    { title: "Safety & Guardrails", description: "Building safe and reliable AI systems", topics: ["Prompt Injection Defense", "Content Moderation", "Output Validation", "Rate Limiting", "Hallucination Detection"], estimated_hours: 4, order: 11 },
  ];

  if (level === "beginner") {
    sections.unshift({
      title: "Getting Started with AI",
      description: "Introduction to AI development environment and tools",
      topics: ["Python Basics for AI", "Setting up Development Environment", "API Keys & Authentication", "First AI Application"],
      estimated_hours: 3,
      order: 0,
    });
    sections.forEach((s, i) => (s.order = i + 1));
  }

  return sections;
}
