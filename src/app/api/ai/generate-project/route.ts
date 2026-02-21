import { NextResponse } from "next/server";
import groq, { AI_MODEL } from "@/lib/groq";
import { generateProjectPrompt } from "@/lib/prompts/project";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { sectionTitle, topics, certification, difficulty, roadmapId, sectionIndex, skipCache } = await request.json();

    // Check cache first (skip on retry)
    if (roadmapId != null && sectionIndex != null && !skipCache) {
      const supabase = await createClient();
      const contentType = `project_${difficulty}`;

      const { data: cached } = await supabase
        .from("ai_content_cache")
        .select("content")
        .eq("roadmap_id", roadmapId)
        .eq("section_index", sectionIndex)
        .eq("content_type", contentType)
        .single();

      if (cached?.content) {
        return NextResponse.json({ project: cached.content, cached: true });
      }
    }

    // No cache — call LLM
    const prompt = generateProjectPrompt(
      sectionTitle,
      topics,
      certification,
      difficulty
    );

    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const content = completion.choices[0]?.message?.content || "{}";

    let project;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      project = JSON.parse(jsonStr);
    } catch {
      project = getDefaultProject(difficulty);
    }

    // Save to cache
    if (roadmapId != null && sectionIndex != null && project.title) {
      const supabase = await createClient();
      const contentType = `project_${difficulty}`;

      await supabase.from("ai_content_cache").upsert(
        { roadmap_id: roadmapId, section_index: sectionIndex, content_type: contentType, content: project },
        { onConflict: "roadmap_id,section_index,content_type" }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate project" },
      { status: 500 }
    );
  }
}

function getDefaultProject(difficulty: "easy" | "medium" | "hard") {
  const defaults = {
    easy: {
      title: "Build a Simple AI Chatbot",
      description: "Create a basic chatbot that uses prompt engineering to respond to user messages. You'll learn how to structure prompts and handle user input.",
      objectives: [
        "Understand prompt engineering basics",
        "Handle user input and context",
        "Generate appropriate responses",
      ],
      language: "javascript",
      estimated_minutes: 30,
      starter_code: `// Simple AI Chatbot
const chatbot = {
  greet: (name) => {
    // TODO: Implement greeting
  },

  respond: (message) => {
    // TODO: Implement response logic
  }
};

// Test your chatbot
console.log(chatbot.greet("User"));
console.log(chatbot.respond("Hello!"));`,
      solution_code: `// Simple AI Chatbot
const chatbot = {
  greet: (name) => {
    return \`Hello \${name}! I'm your AI assistant. How can I help you today?\`;
  },

  respond: (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! How can I assist you today?";
    } else if (lowerMessage.includes("help")) {
      return "I'm here to help! What do you need assistance with?";
    } else {
      return "I understand. Could you tell me more about that?";
    }
  }
};`,
      steps: [
        {
          title: "Setup Chatbot Structure",
          description: "Create the basic chatbot object",
          instructions: "Start by implementing the greet function that returns a personalized greeting.",
          hints: ["Use template literals for string interpolation", "Make the greeting friendly and professional"],
          validation_criteria: ["Function returns a string", "String includes the user's name"],
        },
        {
          title: "Implement Response Logic",
          description: "Add basic message handling",
          instructions: "Implement the respond function to handle different types of messages.",
          hints: ["Convert message to lowercase for comparison", "Use if-else or switch for different message types"],
          validation_criteria: ["Function handles multiple message types", "Returns appropriate responses"],
        },
      ],
    },
    medium: {
      title: "Build a Prompt Template System",
      description: "Create a flexible prompt template system that can generate prompts for different AI tasks. You'll learn about prompt structure and parameter injection.",
      objectives: [
        "Design reusable prompt templates",
        "Implement parameter injection",
        "Handle edge cases and validation",
      ],
      language: "javascript",
      estimated_minutes: 60,
      starter_code: `// Prompt Template System
class PromptTemplate {
  constructor(template) {
    this.template = template;
  }

  generate(params) {
    // TODO: Implement parameter injection
  }

  validate(params) {
    // TODO: Implement validation
  }
}

// Test your template
const template = new PromptTemplate("You are a {{role}}. {{task}}");
console.log(template.generate({ role: "teacher", task: "Explain AI" }));`,
      solution_code: `// Prompt Template System
class PromptTemplate {
  constructor(template) {
    this.template = template;
  }

  generate(params) {
    let result = this.template;
    for (const [key, value] of Object.entries(params)) {
      const placeholder = \`{{\${key}}}\`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    return result;
  }

  validate(params) {
    const placeholders = this.template.match(/{{\w+}}/g) || [];
    const requiredParams = placeholders.map(p => p.slice(2, -2));
    const missing = requiredParams.filter(p => !params[p]);
    return missing.length === 0 ? { valid: true } : { valid: false, missing };
  }
}`,
      steps: [
        {
          title: "Implement Template Generation",
          description: "Create the core template engine",
          instructions: "Implement the generate method to replace placeholders with actual values.",
          hints: ["Use regex to find and replace placeholders", "Handle multiple occurrences of the same placeholder"],
          validation_criteria: ["All placeholders are replaced", "Returns a complete string"],
        },
        {
          title: "Add Parameter Validation",
          description: "Ensure required parameters are provided",
          instructions: "Implement validation to check if all required parameters are present.",
          hints: ["Extract placeholder names from template", "Compare with provided parameters"],
          validation_criteria: ["Returns validation result object", "Identifies missing parameters"],
        },
      ],
    },
    hard: {
      title: "Build a Multi-Agent RAG System",
      description: "Create a Retrieval Augmented Generation system with multiple specialized agents. You'll implement vector search, agent orchestration, and response synthesis.",
      objectives: [
        "Implement vector similarity search",
        "Design multi-agent architecture",
        "Orchestrate agent collaboration",
        "Synthesize responses from multiple sources",
      ],
      language: "javascript",
      estimated_minutes: 90,
      starter_code: `// Multi-Agent RAG System
class VectorStore {
  constructor() {
    this.documents = [];
  }

  addDocument(doc, embedding) {
    // TODO: Implement document storage
  }

  search(query, k = 3) {
    // TODO: Implement similarity search
  }
}

class Agent {
  constructor(name, role) {
    this.name = name;
    this.role = role;
  }

  process(query, context) {
    // TODO: Implement agent processing
  }
}

class RAGOrchestrator {
  constructor(vectorStore, agents) {
    this.vectorStore = vectorStore;
    this.agents = agents;
  }

  query(userQuery) {
    // TODO: Implement RAG pipeline
  }
}`,
      solution_code: `// Multi-Agent RAG System
class VectorStore {
  constructor() {
    this.documents = [];
  }

  addDocument(doc, embedding) {
    this.documents.push({ doc, embedding });
  }

  search(query, k = 3) {
    // Simplified cosine similarity
    const results = this.documents
      .map(({ doc, embedding }) => ({
        doc,
        score: this.cosineSimilarity(query, embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    return results.map(r => r.doc);
  }

  cosineSimilarity(a, b) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
  }
}

class Agent {
  constructor(name, role) {
    this.name = name;
    this.role = role;
  }

  process(query, context) {
    return \`[\${this.name}] Based on \${context.length} documents: \${query}\`;
  }
}

class RAGOrchestrator {
  constructor(vectorStore, agents) {
    this.vectorStore = vectorStore;
    this.agents = agents;
  }

  async query(userQuery) {
    const context = this.vectorStore.search([0.1, 0.2, 0.3], 3);
    const responses = this.agents.map(agent => agent.process(userQuery, context));
    return this.synthesize(responses);
  }

  synthesize(responses) {
    return responses.join("\\n\\n");
  }
}`,
      steps: [
        {
          title: "Implement Vector Store",
          description: "Create the document storage and search system",
          instructions: "Implement document storage and cosine similarity search.",
          hints: ["Store documents with their embeddings", "Implement cosine similarity formula", "Sort by similarity score"],
          validation_criteria: ["Documents can be added", "Search returns top-k results", "Results are sorted by relevance"],
        },
        {
          title: "Create Specialized Agents",
          description: "Build agents with different capabilities",
          instructions: "Implement agent processing logic with role-based behavior.",
          hints: ["Each agent should have unique processing logic", "Use the provided context", "Consider the agent's role in the response"],
          validation_criteria: ["Agents process queries", "Responses reflect agent roles", "Context is utilized"],
        },
        {
          title: "Orchestrate RAG Pipeline",
          description: "Coordinate retrieval and generation",
          instructions: "Implement the full RAG pipeline that retrieves context and generates responses.",
          hints: ["First retrieve relevant documents", "Pass context to agents", "Synthesize multiple agent responses"],
          validation_criteria: ["Retrieval works correctly", "All agents are consulted", "Responses are synthesized"],
        },
      ],
    },
  };

  return defaults[difficulty];
}
