
export interface SubTopic {
  id: string;
  title: string;
}

export interface Chapter {
  id: string;
  title: string;
  topics: SubTopic[];
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  icon?: string; // Icon name for the welcome screen
  chapters: Chapter[];
}

export interface ContentState {
  isLoading: boolean;
  content: string | null;
  error: string | null;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
