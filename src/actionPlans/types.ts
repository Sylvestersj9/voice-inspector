export type ActionPriority = "High" | "Medium" | "Low";
export type ActionStatus = "Open" | "In progress" | "Complete";

export type ActionItem = {
  title: string;
  description: string;
  priority: ActionPriority;
  owner: string;
  due_date: string | null;
  status: ActionStatus;
};

export type ActionPlan = {
  id: string;
  session_id: string;
  actions: ActionItem[];
  created_at: string;
  updated_at: string;
};
