import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Assistant {
  id: string;
  name: string;
  description?: string;
  language: 'hinglish' | 'english' | 'hindi';
  total_queries: number;
  icon?: string;
  created_at: string;
}

interface AssistantState {
  assistants: Assistant[];
  selectedAssistant: Assistant | null;
  loading: boolean;
  error: string | null;
  
  setAssistants: (assistants: Assistant[]) => void;
  setSelectedAssistant: (assistant: Assistant | null) => void;
  addAssistant: (assistant: Assistant) => void;
  removeAssistant: (id: string) => void;
  updateAssistant: (id: string, data: Partial<Assistant>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      assistants: [],
      selectedAssistant: null,
      loading: false,
      error: null,

      setAssistants: (assistants) => set({ assistants }),
      setSelectedAssistant: (assistant) => set({ selectedAssistant: assistant }),
      
      addAssistant: (assistant) =>
        set((state) => ({ assistants: [...state.assistants, assistant] })),
      
      removeAssistant: (id) =>
        set((state) => ({
          assistants: state.assistants.filter((a) => a.id !== id),
          selectedAssistant: state.selectedAssistant?.id === id ? null : state.selectedAssistant,
        })),
      
      updateAssistant: (id, data) =>
        set((state) => ({
          assistants: state.assistants.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        })),
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'assistant-store' }
  )
);