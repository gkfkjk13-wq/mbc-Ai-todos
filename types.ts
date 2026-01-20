
export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  is_completed: boolean;
  priority: Priority;
  created_at: string;
  sub_tasks?: string[];
}

export interface AIAnalysisResult {
  suggestedPriority: Priority;
  subTasks: string[];
  reasoning: string;
}
