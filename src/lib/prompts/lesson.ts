export function generateLessonPrompt(
  sectionTitle: string,
  topics: string[],
  certification: string
): string {
  return `You are an expert AI instructor. Generate a lesson for "${sectionTitle}" (${certification}).

Topics: ${topics.join(", ")}

Respond ONLY with a valid JSON object (no markdown wrapping). Structure:

{
  "overview": "2-3 sentence intro of why this matters in real-world AI applications",
  "concepts": [
    {
      "title": "Concept Name",
      "explanation": "Clear 2-3 sentence explanation using a real-world analogy",
      "key_points": ["point 1", "point 2", "point 3"],
      "real_example": "A concrete code example or real-world implementation",
      "exam_tip": "One specific tip or best practice"
    }
  ],
  "scenarios": [
    {
      "title": "Scenario title",
      "situation": "A real-world AI application scenario (2-3 sentences)",
      "question": "What would be the best approach?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Why this is the correct approach with reasoning",
      "key_concepts": ["Concept1", "Concept2"]
    }
  ],
  "flashcards": [
    {
      "front": "Question or concept name",
      "back": "Concise answer (1-2 sentences max)"
    }
  ]
}

Generate 3-5 concepts, 3 multiple-choice scenarios, and 6-8 flashcards. Keep all text CONCISE — no walls of text. Focus on understanding, not memorization.`;
}
