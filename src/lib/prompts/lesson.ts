export function generateLessonPrompt(
  sectionTitle: string,
  topics: string[],
  certification: string
): string {
  return `You are an expert AWS instructor. Generate a lesson for "${sectionTitle}" (${certification}).

Topics: ${topics.join(", ")}

Respond ONLY with a valid JSON object (no markdown wrapping). Structure:

{
  "overview": "2-3 sentence intro of why this matters in real-world AWS",
  "concepts": [
    {
      "title": "Concept Name",
      "explanation": "Clear 2-3 sentence explanation using a real-world analogy",
      "key_points": ["point 1", "point 2", "point 3"],
      "real_example": "A concrete AWS example — what you'd actually do in the console or CLI",
      "exam_tip": "One specific tip for the exam"
    }
  ],
  "scenario": {
    "title": "Scenario title",
    "situation": "A real company situation (2-3 sentences)",
    "question": "What would you do?",
    "solution": "The correct approach with reasoning",
    "aws_services": ["Service1", "Service2"]
  },
  "flashcards": [
    {
      "front": "Question or concept name",
      "back": "Concise answer (1-2 sentences max)"
    }
  ]
}

Generate 3-5 concepts, 1 scenario, and 6-8 flashcards. Keep all text CONCISE — no walls of text. Focus on understanding, not memorization.`;
}
