import { NextResponse } from "next/server";
import { groqChat, SMART_MODEL, extractJsonObject } from "@/lib/groq";
import { generateProjectPrompt } from "@/lib/prompts/project";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { sectionTitle, topics, certification, difficulty, skipCache } = await request.json();

    const prompt = generateProjectPrompt(sectionTitle, topics, certification, difficulty);

    const content = await groqChat({
      model: SMART_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
      ttl: skipCache ? 0 : 86400, // 24h, bypass on explicit retry
    });

    let project;
    try {
      project = extractJsonObject(content);
    } catch {
      project = getDefaultProject(difficulty);
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project generation error:", error);
    return NextResponse.json({ error: "Failed to generate project" }, { status: 500 });
  }
}

function getDefaultProject(difficulty: "easy" | "medium" | "hard") {
  const defaults = {
    easy: {
      title: "Build a Simple AI Chatbot",
      description: "Create a basic chatbot that uses prompt engineering to respond to user messages.",
      objectives: ["Understand prompt engineering basics", "Handle user input and context", "Generate appropriate responses"],
      language: "javascript",
      estimated_minutes: 30,
      starter_code: `const chatbot = {\n  greet: (name) => { /* TODO */ },\n  respond: (message) => { /* TODO */ }\n};`,
      solution_code: `const chatbot = {\n  greet: (name) => \`Hello \${name}! How can I help?\`,\n  respond: (message) => message.toLowerCase().includes("hello") ? "Hi there!" : "Tell me more."\n};`,
      steps: [{ title: "Setup Chatbot", description: "Create the basic structure", instructions: "Implement greet and respond.", hints: ["Use template literals"], validation_criteria: ["Returns a string"] }],
    },
    medium: {
      title: "Build a Prompt Template System",
      description: "Create a flexible prompt template system.",
      objectives: ["Design reusable templates", "Implement parameter injection"],
      language: "javascript",
      estimated_minutes: 60,
      starter_code: `class PromptTemplate {\n  constructor(template) { this.template = template; }\n  generate(params) { /* TODO */ }\n}`,
      solution_code: `class PromptTemplate {\n  constructor(template) { this.template = template; }\n  generate(params) { let r = this.template; for (const [k,v] of Object.entries(params)) r = r.replace(new RegExp(\`{{\${k}}}\`, "g"), v); return r; }\n}`,
      steps: [{ title: "Implement Template", description: "Core engine", instructions: "Replace placeholders.", hints: ["Use regex"], validation_criteria: ["Placeholders replaced"] }],
    },
    hard: {
      title: "Build a Multi-Agent RAG System",
      description: "Create a Retrieval Augmented Generation system.",
      objectives: ["Implement vector similarity", "Design multi-agent architecture"],
      language: "javascript",
      estimated_minutes: 90,
      starter_code: `class VectorStore {\n  constructor() { this.docs = []; }\n  add(doc, emb) { /* TODO */ }\n  search(q, k=3) { /* TODO */ }\n}`,
      solution_code: `class VectorStore {\n  constructor() { this.docs = []; }\n  add(doc, emb) { this.docs.push({doc, emb}); }\n  search(q, k=3) { return this.docs.slice(0, k).map(d => d.doc); }\n}`,
      steps: [{ title: "Vector Store", description: "Storage and search", instructions: "Implement add and search.", hints: ["Use cosine similarity"], validation_criteria: ["Returns top-k results"] }],
    },
  };
  return defaults[difficulty] ?? defaults.easy;
}
