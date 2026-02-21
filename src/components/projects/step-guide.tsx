"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ProjectStep } from "@/types";

interface StepGuideProps {
  steps: ProjectStep[];
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
}

export default function StepGuide({ steps, currentStep, onStepChange }: StepGuideProps) {
  const [showHints, setShowHints] = useState(false);

  const current = steps[currentStep];

  return (
    <div className="flex flex-col h-full">
      {/* Progress tracker */}
      <div className="p-4 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold mb-3">Progress</h3>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => onStepChange(i)}
              className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                i === currentStep
                  ? "bg-primary/10 border-2 border-primary"
                  : i < currentStep
                  ? "bg-emerald-50 hover:bg-emerald-100"
                  : "hover:bg-muted"
              }`}
            >
              {i < currentStep ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : i === currentStep ? (
                <Circle className="h-5 w-5 text-primary fill-primary shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${
                  i === currentStep ? "text-primary" : ""
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {step.description}
                </div>
              </div>
              {i === currentStep && (
                <Badge variant="secondary" className="shrink-0">Step {i + 1}/{steps.length}</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current step details */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold mb-1">{current.title}</h2>
            <p className="text-sm text-muted-foreground">{current.description}</p>
          </div>

          <Card className="border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">Instructions</h3>
              <div className="prose-content text-sm">
                <ReactMarkdown>{current.instructions}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {current.validation_criteria.length > 0 && (
            <Card className="border-border bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Validation Criteria
                </h3>
                <ul className="space-y-1 text-sm">
                  {current.validation_criteria.map((criteria, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {current.hints.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHints(!showHints)}
                  className="w-full justify-between p-0 hover:bg-transparent"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    Hints ({current.hints.length})
                  </div>
                  {showHints ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {showHints && (
                  <ul className="mt-3 space-y-2 text-sm">
                    {current.hints.map((hint, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">{i + 1}.</span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
