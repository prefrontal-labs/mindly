export function generateRoadmapPrompt(
  certification: string,
  experienceLevel: string
): string {
  return `You are an expert cloud certification instructor. Generate a personalized learning roadmap for the ${certification} certification.

The student's experience level is: ${experienceLevel}

Generate a structured learning roadmap as a JSON array of sections. Each section should have:
- "title": Section name (e.g., "IAM & Security Fundamentals")
- "description": Brief description of what the student will learn
- "topics": Array of specific topics covered (3-6 topics)
- "estimated_hours": Estimated study hours for this section
- "order": Section order number starting from 1

For a ${experienceLevel} student studying ${certification}, create 10-12 sections that cover all exam domains.
The roadmap should progress from foundational concepts to advanced topics.

${experienceLevel === "beginner" ? "Include extra foundational sections on cloud basics and AWS core concepts." : ""}
${experienceLevel === "advanced" ? "Focus more on advanced architecture patterns, optimization, and edge cases." : ""}

Respond ONLY with a valid JSON array. No markdown, no explanation.`;
}
