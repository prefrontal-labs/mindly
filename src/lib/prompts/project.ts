export function generateProjectPrompt(
  sectionTitle: string,
  topics: string[],
  certification: string,
  difficulty: "easy" | "medium" | "hard"
): string {
  const difficultyGuidance = {
    easy: "beginner-friendly with clear step-by-step guidance, basic concepts, and simple implementation",
    medium: "intermediate complexity with some problem-solving required, covers multiple concepts",
    hard: "advanced with complex architecture, requires deep understanding and creative problem-solving",
  };

  const estimatedTime = {
    easy: 30,
    medium: 60,
    hard: 90,
  };

  return `You are an expert ${certification} project designer.

Generate a hands-on coding project for the section: "${sectionTitle}"
Topics: ${topics.join(", ")}
Difficulty: ${difficulty} (${difficultyGuidance[difficulty]})

Create a real-world project that reinforces these concepts through practical application.

Respond ONLY with a valid JSON object (no markdown wrapping). Structure:

{
  "title": "Project title (concise, action-oriented)",
  "description": "2-3 sentence overview of what the student will build and why it matters",
  "objectives": [
    "Learning objective 1",
    "Learning objective 2",
    "Learning objective 3"
  ],
  "language": "javascript|python|typescript (choose most appropriate for ${certification})",
  "estimated_minutes": ${estimatedTime[difficulty]},
  "starter_code": "Complete starter code template with comments guiding what to implement",
  "solution_code": "Complete working solution (reference for AI evaluation)",
  "steps": [
    {
      "title": "Step title",
      "description": "Brief step description",
      "instructions": "Detailed instructions with code examples and explanations",
      "hints": ["Helpful hint 1", "Helpful hint 2"],
      "validation_criteria": ["What to check for completion", "Expected behavior"]
    }
  ]
}

Guidelines:
- Make it practical and relevant to real-world AI applications
- Include 3-5 steps depending on difficulty
- Starter code should have clear TODOs and comments
- Solution code must be complete and working
- Instructions should teach, not just tell
- Hints should guide without giving away the solution
- Validation criteria should be specific and testable

For ${difficulty} difficulty:
${difficulty === "easy" ? "- Focus on one core concept\n- Provide more scaffolding\n- Clear, detailed instructions" : ""}
${difficulty === "medium" ? "- Combine 2-3 concepts\n- Moderate scaffolding\n- Some problem-solving required" : ""}
${difficulty === "hard" ? "- Advanced architecture\n- Minimal scaffolding\n- Requires creative thinking" : ""}`;
}

export function evaluateCodePrompt(
  code: string,
  solutionCode: string,
  step: {
    title: string;
    validation_criteria: string[];
  },
  language: string
): string {
  return `You are an expert code reviewer for ${language}.

Evaluate the student's code for this step: "${step.title}"

**Student's Code:**
\`\`\`${language}
${code}
\`\`\`

**Reference Solution:**
\`\`\`${language}
${solutionCode}
\`\`\`

**Validation Criteria:**
${step.validation_criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Provide constructive feedback on:
1. Whether the code meets the validation criteria
2. Code quality and best practices
3. Potential improvements
4. Specific issues (with line numbers if applicable)

Respond ONLY with a valid JSON object (no markdown):

{
  "overall": "Brief overall assessment (2-3 sentences)",
  "score": 0-100,
  "issues": [
    {
      "severity": "error|warning|info",
      "line": <line_number_or_null>,
      "message": "Specific issue description"
    }
  ],
  "suggestions": [
    "Specific suggestion for improvement 1",
    "Specific suggestion for improvement 2"
  ],
  "timestamp": "${new Date().toISOString()}"
}

Be encouraging and constructive. Focus on helping the student improve, not just pointing out flaws.
If the code is very close to working, acknowledge what's good before suggesting improvements.`;
}
