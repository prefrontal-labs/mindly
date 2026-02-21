"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Code2, Target } from "lucide-react";

interface ProjectSelectorProps {
  roadmapId: string;
  sectionIndex: number;
}

const projectCards = [
  {
    difficulty: "easy" as const,
    icon: "🟢",
    color: "emerald",
    label: "Easy",
    tagline: "Perfect for beginners",
    estimatedTime: "30 min",
  },
  {
    difficulty: "medium" as const,
    icon: "🟡",
    color: "amber",
    label: "Medium",
    tagline: "Intermediate challenge",
    estimatedTime: "1 hour",
  },
  {
    difficulty: "hard" as const,
    icon: "🔴",
    color: "red",
    label: "Hard",
    tagline: "Advanced project",
    estimatedTime: "1.5 hours",
  },
];

export default function ProjectSelector({ roadmapId, sectionIndex }: ProjectSelectorProps) {
  const router = useRouter();

  const handleStart = (difficulty: string) => {
    router.push(`/projects/${roadmapId}/${sectionIndex}/${difficulty}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Code2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Hands-On Projects</h2>
        </div>
        <p className="text-muted-foreground">
          Apply what you've learned by building real projects. Choose your difficulty level.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {projectCards.map((project) => (
          <Card
            key={project.difficulty}
            className={`border-2 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer
              ${project.color === "emerald" ? "border-emerald-200 hover:border-emerald-400" : ""}
              ${project.color === "amber" ? "border-amber-200 hover:border-amber-400" : ""}
              ${project.color === "red" ? "border-red-200 hover:border-red-400" : ""}
            `}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <span className="text-4xl">{project.icon}</span>
                <Badge
                  className={`
                    ${project.color === "emerald" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                    ${project.color === "amber" ? "bg-amber-500 hover:bg-amber-600" : ""}
                    ${project.color === "red" ? "bg-red-500 hover:bg-red-600" : ""}
                  `}
                >
                  {project.label}
                </Badge>
              </div>
              <CardTitle className="text-xl">{project.tagline}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>~{project.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>
                    {project.difficulty === "easy" && "Learn core concepts"}
                    {project.difficulty === "medium" && "Combine multiple skills"}
                    {project.difficulty === "hard" && "Advanced architecture"}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => handleStart(project.difficulty)}
                className={`w-full
                  ${project.color === "emerald" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  ${project.color === "amber" ? "bg-amber-500 hover:bg-amber-600" : ""}
                  ${project.color === "red" ? "bg-red-500 hover:bg-red-600" : ""}
                `}
              >
                Start Project
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Pro Tip</h3>
            <p className="text-sm text-muted-foreground">
              Start with Easy to build confidence, then progress to Medium and Hard.
              Each project builds on the concepts from the lesson and includes AI-powered code feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
