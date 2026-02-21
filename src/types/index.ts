export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  experience_level: "beginner" | "intermediate" | "advanced";
  created_at: string;
}

export interface Certification {
  id: string;
  name: string;
  code: string;
  provider: string;
  description: string;
  icon: string;
  color: string;
}

export interface RoadmapSection {
  title: string;
  description: string;
  topics: string[];
  estimated_hours: number;
  order: number;
}

export interface Roadmap {
  id: string;
  user_id: string;
  certification_id: string;
  title: string;
  sections: RoadmapSection[];
  experience_level: string;
  created_at: string;
}

export interface SectionProgress {
  id: string;
  user_id: string;
  roadmap_id: string;
  section_index: number;
  status: "not_started" | "in_progress" | "completed";
  score: number | null;
  completed_at: string | null;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  roadmap_id: string;
  section_index: number;
  questions: QuizQuestion[];
  user_answers: number[];
  score: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: string;
  criteria_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  roadmap_id: string | null;
  section_index: number | null;
  session_type: "tutor" | "interview";
  messages: ChatMessage[];
  created_at: string;
}

export interface ProjectStep {
  title: string;
  description: string;
  instructions: string;
  hints: string[];
  validation_criteria: string[];
}

export interface Project {
  id: string;
  roadmap_id: string;
  section_index: number;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  description: string;
  objectives: string[];
  steps: ProjectStep[];
  starter_code: string;
  solution_code: string;
  language: string;
  estimated_minutes: number;
  created_at: string;
}

export interface ProjectSubmission {
  id: string;
  user_id: string;
  project_id: string;
  code: string;
  current_step: number;
  feedback: { [stepIndex: number]: CodeFeedback };
  completed: boolean;
  last_saved_at: string;
  completed_at: string | null;
}

export interface CodeFeedback {
  overall: string;
  issues: CodeIssue[];
  suggestions: string[];
  score: number; // 0-100
  timestamp: string;
}

export interface CodeIssue {
  severity: "error" | "warning" | "info";
  line?: number;
  message: string;
}
