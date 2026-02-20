export function generateQuizPrompt(
  sectionTitle: string,
  topics: string[],
  certification: string,
  difficulty: "easy" | "medium" | "hard" = "medium"
): string {
  return `You are an expert ${certification} exam question writer.

Generate 5 exam-style questions for the section: "${sectionTitle}"
Topics: ${topics.join(", ")}
Difficulty: ${difficulty}

Create questions that test real understanding, not just memorization.
Include scenario-based questions similar to the actual ${certification} exam.

Respond with a JSON array of questions. Each question object must have:
- "id": number (1-5)
- "question": the question text (include scenario context for scenario questions)
- "options": array of 4 answer choices (strings)
- "correct_answer": index of correct answer (0-3)
- "explanation": detailed explanation of why the correct answer is right and others are wrong
- "difficulty": "${difficulty}"

Respond ONLY with a valid JSON array. No markdown, no explanation.`;
}
